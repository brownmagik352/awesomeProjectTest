import React, { Component } from 'react';
import { View, FlatList, StyleSheet, Button, AsyncStorage, Alert } from 'react-native';
import Contacts from 'react-native-contacts';
// import PushNotification from 'react-native-push-notification';
import call from 'react-native-phone-call';
import SendSMS from 'react-native-sms';
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
    // console.log("COMPONENT DID MOUNT");

    // get contacts list
    Contacts.getAll((err, contacts) => {
      if (err) throw err;

      // contacts returned
      // console.log(contacts);

      this.setState({ contacts });
    });

    // get stored reminders
    this.retrieveReminders();

    // PushNotification.localNotificationSchedule({
    //     //... You can use all the options from localNotifications
    //     message: "Test 10s", // (required)
    //     date: new Date(Date.now() + (10 * 1000))
    // });
  }

  // TODO: handle getting name in all cases (names missing etc.)
  static getName(contact) {
    return `${contact.givenName} ${contact.familyName}`;
  }

  // TODO: handle getting name in all cases (names missing etc.)
  static getNumber(contact) {
    return contact.phoneNumbers[0].number;
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
      if (reminders[i].name === contact.name) {
        Alert.alert(`You already have a reminder set for ${contact.name}`);
        return;
      }
    }

    this.updateReminders(contact, '');
  }

  handleReminderPress(contact, callOrText) {
    if (callOrText === 'call') {
      call({ number: contact.number, prompt: true }).catch(console.error);
      this.updateReminders(contact, `Called on ${Date.now()}`);
    } else if (callOrText === 'text') {
      SendSMS.send(
        {
          body: '',
          recipients: [contact.number],
          successTypes: ['sent', 'queued'],
        },
        (completed, cancelled, error) => {
          this.updateReminders(contact, `Messaged on ${Date.now()}`); // TODO: handle cancel & error case
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
      remindersList.push(contactToUpdate);
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
        <Button title="Show/Hide Contacts" onPress={() => this.toggleContactListVisible()} />

        {contactListVisible && (
          <FlatList
            data={contacts}
            renderItem={({ item }) => (
              <ContactListItem
                name={Main.getName(item)}
                onPress={() =>
                  this.handleContactPress({
                    name: Main.getName(item),
                    number: Main.getNumber(item),
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
