import React, { Component } from 'react';
import { View, FlatList, StyleSheet, Button, AsyncStorage, Alert } from 'react-native';
import Contacts from 'react-native-contacts';
import PushNotification from 'react-native-push-notification';
import call from 'react-native-phone-call';
import SendSMS from 'react-native-sms';
import moment from 'moment';
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

  handleContactPress = contact => {
    const { reminders } = this.state;

    // check if name in reminders already
    for (let i = 0; i < reminders.length; i += 1) {
      if (reminders[i].name === contact.name || reminders[i].number === contact.number) {
        Alert.alert(`You already have a reminder set for ${contact.name} (${contact.number})`);
        return;
      }
    }

    this.updateReminders(contact, '').then(
      PushNotification.localNotificationSchedule({
        id: `${contact.id}`,
        message: contact.name, // (required)
        date: Main.getStartDate(contact.startDateString),
        repeatType: 'time',
        repeatTime: Main.getRepeatTime(contact.repeatString),
      })
    );
  };

  // TODO: put lastContactString and CallOrText at initialization in render
  handleReminderPress(contact, callOrText) {
    const nowLocalized = moment().format('MMMM Do YYYY');

    if (callOrText === 'call') {
      call({ number: contact.number, prompt: true }).catch(console.error);
      this.updateReminders(contact, `Called on ${nowLocalized}`);
    } else if (callOrText === 'text') {
      SendSMS.send(
        {
          body: '',
          recipients: [contact.number],
          successTypes: ['sent', 'queued'],
        },
        (completed, cancelled, error) => {
          this.updateReminders(contact, `Messaged on ${nowLocalized}`); // TODO: handle cancel & error case
          console.log(
            `SMS Callback: completed: ${completed} cancelled: ${cancelled}error: ${error}`
          );
        }
      );
    }
  }

  async deleteReminder(contactToBeDeleted) {
    const { reminders } = this.state;

    if (reminders != null && reminders.length > 0) {
      const remindersList = reminders.slice();
      const deletionIndex = remindersList.findIndex(
        contact => contact.name === contactToBeDeleted.name
      );
      remindersList.splice(deletionIndex, 1);

      try {
        // update stored data
        await AsyncStorage.setItem('reminders', JSON.stringify(remindersList));
        // update state
        this.setState({ reminders: remindersList });
        PushNotification.cancelLocalNotifications({ id: `${contactToBeDeleted.id}` });
        Alert.alert(`${contactToBeDeleted.name} deleted`);
      } catch (error) {
        Alert.alert(`Error deleting ${contactToBeDeleted.name}`);
        console.log(error);
      }
    }
  }

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

  // TODO: don't update the whole array each time
  async updateReminders(contactToUpdate, lastContactString) {
    const { reminders } = this.state;
    const remindersList = reminders != null ? reminders.slice() : [];

    // update existing reminder vs. add new one based on if lastContactString updates or not
    if (lastContactString !== '') {
      const matchingIndex = remindersList.indexOf(contactToUpdate);
      remindersList[matchingIndex].lastContact = lastContactString;
    } else {
      // copy object, give it lastContactString, add it to the reminders array
      const contactToAdd = Object.assign({}, contactToUpdate);
      contactToAdd.lastContact = lastContactString;
      remindersList.push(contactToAdd);
    }

    try {
      // update stored data
      await AsyncStorage.setItem('reminders', JSON.stringify(remindersList));
      // update state
      this.setState({ reminders: remindersList });
    } catch (error) {
      Alert.alert('Error saving reminders');
      console.log(error);
    }
  }

  debugReset() {
    AsyncStorage.clear();
    PushNotification.cancelAllLocalNotifications();
    this.setState({ reminders: [] });
  }

  render() {
    const { reminders, contactListVisible, contacts } = this.state;
    return (
      <View style={styles.container}>
        <Button title="DEBUG WIPE DATA" onPress={() => this.debugReset()} />
        <FlatList
          data={reminders}
          renderItem={({ item }) => (
            <Reminder
              name={item.name}
              lastContact={item.lastContact}
              repeatString={item.repeatString}
              onPressCall={() => this.handleReminderPress(item, 'call')}
              onPressText={() => this.handleReminderPress(item, 'text')}
              onDelete={() => this.deleteReminder(item)}
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
                parentCallbackHandleContactPress={this.handleContactPress}
              />
            )}
            keyExtractor={index => index.toString()}
          />
        )}
      </View>
    );
  }
}
