import React, { Component } from 'react';
import { View, FlatList, StyleSheet, Button, AsyncStorage, alert } from 'react-native';
import Contacts from 'react-native-contacts';
// import PushNotification from 'react-native-push-notification';
import ContactListItem from './ContactListItem';
import ActionableContact from './ActionableContact';

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
  },
});

export default class Reminders extends Component {
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

  handlePress(contact) {
    // update state
    let remindersList = [];
    const { reminders } = this.state;
    if (reminders != null) {
      remindersList = reminders.slice();
    }
    remindersList.push(contact);
    this.setState({ reminders: remindersList }); // TODO: don't update the whole array each time

    // update stored data
    AsyncStorage.setItem('reminders', JSON.stringify(remindersList));
  }

  async retrieveReminders() {
    try {
      const storedReminders = await AsyncStorage.getItem('reminders');
      let reminders = JSON.parse(storedReminders);
      if (reminders == null) {
        reminders = [];
      }
      this.setState({ reminders });
    } catch (error) {
      alert('Error loading saved reminders');
      console.log(error);
      this.setState({ reminders: [] });
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
        <Button title="WIPE DATA" onPress={() => this.debugReset()} />
        <FlatList
          data={reminders}
          renderItem={({ item }) => <ActionableContact name={item.name} number={item.number} />}
          keyExtractor={item => item.name}
        />
        <Button title="Show/Hide Contacts" onPress={() => this.toggleContactListVisible()} />

        {contactListVisible && (
          <FlatList
            data={contacts}
            renderItem={({ item }) => (
              <ContactListItem
                name={Reminders.getName(item)}
                onPress={() =>
                  this.handlePress({
                    name: Reminders.getName(item),
                    number: Reminders.getNumber(item),
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
