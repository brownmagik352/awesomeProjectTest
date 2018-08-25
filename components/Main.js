import React, { Component } from 'react';
import { View, FlatList, StyleSheet, Button, AsyncStorage, Alert } from 'react-native';
import Contacts from 'react-native-contacts';
import PushNotification from 'react-native-push-notification';
import ContactListItem from './ContactListItem';
import Reminder from './Reminder';

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
  },
});

export default class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      reminders: [],
      contactListVisible: false,
      contacts: [],
    };
  }

  componentDidMount() {
    // get contacts list
    Contacts.getAll((err, contacts) => {
      if (err) throw err;

      this.setState({ contacts });
    });

    // get stored reminders
    this.retrieveReminders();
  }

  // given a phone number string to just digits
  static stripNonDigitsFromPhoneNumber(phoneNumberString) {
    const validNumChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const numberStringArray = phoneNumberString.split('');
    const badCharsIndicesArray = [];
    // find all the indices where there isn't a number in the phoneNumberString
    for (let i = 0; i < numberStringArray.length; i += 1) {
      if (!validNumChars.includes(numberStringArray[i])) badCharsIndicesArray.push(i);
    }
    // remove all bad chars
    for (let i = badCharsIndicesArray.length - 1; i >= 0; i -= 1)
      numberStringArray.splice(badCharsIndicesArray[i], 1);

    return numberStringArray.join('');
  }

  // TODO: handle getting name in all cases (names missing etc.)
  static getName(contact) {
    return `${contact.givenName} ${contact.familyName}`;
  }

  // TODO: handle getting name in all cases (names missing etc.)
  static getNumber(contact) {
    if (contact.phoneNumbers.length === 0) return ''; // need to remove for real
    return Main.stripNonDigitsFromPhoneNumber(contact.phoneNumbers[0].number);
  }

  static getStartDate(startDateString) {
    const mapStartDateStringToStartDateDate = {
      'One day from now': 1,
      'Two days from now': 2,
      'Three days from now': 3,
      'Four days from now': 4,
      'Five days from now': 5,
      'Six days from now': 6,
    };

    /* TESTING ONLY */
    if (startDateString === 'test') return new Date(Date.now() + 10 * 1000);

    const today = new Date();
    const firstDate = new Date(today);
    firstDate.setDate(today.getDate() + mapStartDateStringToStartDateDate[startDateString]);
    // normalize to noon, allow for min/s/ms variation so as to not get bombarded
    firstDate.setHours(12);
    return firstDate;
  }

  static getRepeatTime(repeatString) {
    const oneDayMilliseconds = 1000 * 60 * 60 * 24;
    const mapRepeatStringToRepeatTime = {
      'Every day': 1,
      'Every week': 7,
      'Every two weeks': 14,
      'Every three weeks': 21,
      'Every four weeks': 28,
    };

    /* TESTING ONLY */
    if (repeatString === 'test') return 5 * 1000;

    return mapRepeatStringToRepeatTime[repeatString] * oneDayMilliseconds;
  }

  // assigns a new random ID
  getNewReminderId() {
    const maxInt = Math.pow(2, 31) - 1; // react-native-push-notification has a 32bit int max
    let idCandidate = Math.floor(Math.random() * maxInt);
    while (this.alreadyUsedReminderId(idCandidate)) {
      idCandidate = Math.floor(Math.random() * maxInt);
    }
    return idCandidate;
  }

  // checks if a given id is already being used for a reminder
  alreadyUsedReminderId(idCandidate) {
    const { reminders } = this.state;
    for (let i = 0; i < reminders.length; i += 1) {
      if (reminders[i].id === idCandidate) return true;
    }
    return false;
  }

  toggleContactListVisible() {
    const { contactListVisible } = this.state;
    if (contactListVisible) {
      this.setState({ contactListVisible: false });
    } else {
      this.setState({ contactListVisible: true });
    }
  }

  addReminder = contactToAdd => {
    const { reminders } = this.state;
    const remindersCopy = reminders != null ? reminders.slice() : [];

    // check if name in reminders already
    for (let i = 0; i < reminders.length; i += 1) {
      if (reminders[i].name === contactToAdd.name || reminders[i].number === contactToAdd.number) {
        Alert.alert(
          `You already have a reminder set for ${contactToAdd.name} (${contactToAdd.number})`
        );
        return;
      }
    }

    remindersCopy.push(contactToAdd);

    this.saveReminderData(remindersCopy)
      .then(
        PushNotification.localNotificationSchedule({
          id: `${contactToAdd.id}`,
          message: contactToAdd.name, // (required)
          date: Main.getStartDate(contactToAdd.startDateString),
          repeatType: 'time',
          repeatTime: Main.getRepeatTime(contactToAdd.repeatString),
        })
      )
      .catch(error => {
        Alert.alert(`Error deleting reminder for ${contactToAdd.name}`);
        console.log(error);
      });
  };

  updateReminder = reminderToUpdate => {
    const { reminders } = this.state;
    const remindersCopy = reminders != null ? reminders.slice() : [];

    const matchingIndex = remindersCopy.findIndex(
      reminder => reminder.name === reminderToUpdate.name
    );
    remindersCopy[matchingIndex] = reminderToUpdate;
    this.saveReminderData(remindersCopy).catch(error => {
      console.log(error);
    });
  };

  deleteReminder = contactToBeDeleted => {
    const { reminders } = this.state;

    if (reminders != null && reminders.length > 0) {
      const remindersCopy = reminders.slice();
      const deletionIndex = remindersCopy.findIndex(
        contact => contact.name === contactToBeDeleted.name
      );
      remindersCopy.splice(deletionIndex, 1);

      this.saveReminderData(remindersCopy)
        .then(PushNotification.cancelLocalNotifications({ id: `${contactToBeDeleted.id}` }))
        .catch(error => {
          Alert.alert(`Error deleting reminder for ${contactToBeDeleted.name}`);
          console.log(error);
        });
    }
  };

  async retrieveReminders() {
    try {
      const storedReminders = await AsyncStorage.getItem('reminders');
      let reminders = JSON.parse(storedReminders);
      if (reminders == null) reminders = [];
      this.setState({ reminders });
    } catch (error) {
      Alert.alert('Error loading saved reminders');
      console.log(error);
      this.setState({ reminders: [] });
    }
  }

  async saveReminderData(updatedReminders) {
    try {
      // update stored data
      await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
      // update state
      this.setState({ reminders: updatedReminders });
    } catch (error) {
      Alert.alert('Error saving reminders');
      console.log(error);
    }
  }

  /* TESTING ONLY */
  testReset() {
    AsyncStorage.clear();
    PushNotification.cancelAllLocalNotifications();
    this.setState({ reminders: [] });
  }

  render() {
    const { reminders, contactListVisible, contacts } = this.state;
    return (
      <View style={styles.container}>
        <Button title="DEBUG WIPE DATA" onPress={() => this.testReset()} />
        <FlatList
          data={reminders}
          renderItem={({ item }) => (
            <Reminder
              reminder={item}
              parentCallbackUpdateReminder={this.updateReminder}
              parentCallbackDeleteReminder={this.deleteReminder}
            />
          )}
          keyExtractor={item => item.name}
        />
        <Button title="Show/Hide Contacts " onPress={() => this.toggleContactListVisible()} />

        {contactListVisible && (
          <FlatList
            data={contacts}
            renderItem={({ item }) => (
              <ContactListItem
                name={Main.getName(item)}
                number={Main.getNumber(item)}
                id={this.getNewReminderId()}
                parentCallbackHandleContactPress={this.addReminder}
              />
            )}
            keyExtractor={index => index.toString()}
          />
        )}
      </View>
    );
  }
}
