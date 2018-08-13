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

// notification ID numbers for react-native-push-notifications is smaller than all possible phone numbers
function normalize(numberString) {
  const originalNumber = Number(numberString);
  const maxNotificationIdVal = Math.pow(2, 31) - 1;
  if (originalNumber > maxNotificationIdVal) {
    const normalizedVal = -1 * (originalNumber % maxNotificationIdVal);
    return `${normalizedVal}`;
  }

  return numberString;
}

// given a phone number in any string format, strips it down to just digits
function stripNonDigitsFromPhoneNumber(phoneNumberString) {
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
function getName(contact) {
  return `${contact.givenName} ${contact.familyName}`;
}

// TODO: handle getting name in all cases (names missing etc.)
function getNumber(contact) {
  return stripNonDigitsFromPhoneNumber(contact.phoneNumbers[0].number);
}

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

  toggleContactListVisible() {
    const { contactListVisible } = this.state;
    if (contactListVisible) {
      this.setState({ contactListVisible: false });
    } else {
      this.setState({ contactListVisible: true });
    }
  }

  handleContactPress(contact) {
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
        id: normalize(contact.number),
        message: contact.name, // (required)
        date: new Date(Date.now() + 10 * 1000),
        repeatType: 'time',
        repeatTime: 1000 * 10,
      })
    );
  }

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
              onPressCall={() => this.handleReminderPress(item, 'call')}
              onPressText={() => this.handleReminderPress(item, 'text')}
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
                name={getName(item)}
                onPress={() =>
                  this.handleContactPress({
                    name: getName(item),
                    number: getNumber(item),
                  })
                }
              />
            )}
            keyExtractor={index => index.toString()}
          />
        )}
      </View>
    );
  }
}
