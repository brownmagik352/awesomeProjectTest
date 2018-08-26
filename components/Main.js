import React, { Component } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Button,
  AsyncStorage,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import Contacts from 'react-native-contacts';
import PushNotification from 'react-native-push-notification';
import { mapRepeatStringToRepeatTime, mapStartDateStringToStartDateDate } from '../constants';
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
      contacts: [],

      // contacts searching variables
      contactSearchVisible: false,
      scopedContacts: [],
    };
  }

  componentDidMount() {
    // get contacts list
    Contacts.getAll((err, contacts) => {
      if (err) throw err;

      this.contactsListPrep(contacts);
    });

    // get stored reminders
    this.retrieveReminders();
  }

  // TODO: handle getting name in all cases (names missing etc.)
  static getName(contact) {
    const firstName = contact.givenName != null ? contact.givenName : '';
    const lastName = contact.familyName != null ? contact.familyName : '';
    return `${firstName} ${lastName}`;
  }

  static getStartDate(startDateString) {
    /* TESTING ONLY */
    if (startDateString === 'test') return new Date(Date.now() + 5 * 1000);

    const today = new Date();
    const firstDate = new Date(today);
    firstDate.setDate(today.getDate() + mapStartDateStringToStartDateDate[startDateString]);
    // normalize to noon, allow for min/s/ms variation so as to not get bombarded
    firstDate.setHours(12);
    return firstDate;
  }

  static getRepeatTime(repeatString) {
    const oneDayMilliseconds = 1000 * 60 * 60 * 24;

    /* TESTING ONLY */
    if (repeatString === 'test') return 5 * 1000;

    return mapRepeatStringToRepeatTime[repeatString] * oneDayMilliseconds;
  }

  // create contact list with minimal needed info and a unique key
  contactsListPrep(rawContacts) {
    const contacts = rawContacts.map((contact, index) => {
      const name = Main.getName(contact);
      const { phoneNumbers } = contact;
      const key = `${name} (${index})`; // need a key for virtualizedlist
      return { name, phoneNumbers, key };
    });

    this.setState({ contacts });
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

  updateSearch(searchText) {
    const { contacts } = this.state;
    const serachTextLowerCase = searchText.toLowerCase();
    const scopedContacts = contacts.filter(contact =>
      contact.name.toLowerCase().match(serachTextLowerCase)
    );

    this.setState({ scopedContacts });
  }

  addReminder = contactToAdd => {
    this.setState({ contactSearchVisible: false });
    const { reminders } = this.state;
    const remindersCopy = reminders != null ? reminders.slice() : [];

    // check if name in reminders already
    for (let i = 0; i < reminders.length; i += 1) {
      if (reminders[i].name === contactToAdd.name && reminders[i].number === contactToAdd.number) {
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
    const { reminders, scopedContacts, contactSearchVisible } = this.state;
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
        <Button
          title="Add Reminder"
          onPress={() => this.setState({ contactSearchVisible: true })}
        />

        <Modal
          animationType="fade"
          transparent={false}
          visible={contactSearchVisible}
          onRequestClose={() => {
            this.setState({ contactSearchVisible: false });
          }}
        >
          <View>
            <TextInput
              onChangeText={searchtext => this.updateSearch(searchtext)}
              placeholder="Search your contacts"
            />
            <FlatList
              data={scopedContacts}
              renderItem={({ item }) => (
                <ContactListItem
                  name={item.name}
                  phoneNumbers={item.phoneNumbers}
                  id={this.getNewReminderId()}
                  parentCallbackHandleContactPress={this.addReminder}
                />
              )}
            />
          </View>
        </Modal>
      </View>
    );
  }
}
