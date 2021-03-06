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
  Image,
  Text,
  PermissionsAndroid,
  ScrollView,
} from 'react-native';
import Contacts from 'react-native-contacts';
import PushNotification from 'react-native-push-notification';
import { Client } from 'rollbar-react-native';
import SplashScreen from 'react-native-splash-screen';
import { AdMobBanner } from 'react-native-admob';
import {
  mapRepeatStringToRepeatTime,
  mapStartDateStringToStartDateDate,
  rollbarKey,
  sharedStyles,
  freeVersion,
} from '../constants';
import ContactListItem from './ContactListItem';
import Reminder from './Reminder';

const rollbar = new Client(rollbarKey);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listMargins: {
    marginTop: 20,
    marginLeft: 10,
    marginRight: 10,
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  addReminderButton: {
    width: 25,
  },
  logoStyle: {
    position: 'absolute',
    width: 80,
    height: 80,
    marginTop: 5,
    marginLeft: 5,
    zIndex: 1,
  },
  banner: {
    alignItems: 'center',
    marginTop: 27,
    backgroundColor: '#4caf50',
  },
  bannerText: {
    color: 'white',
    fontSize: 24,
    fontFamily: 'Helvetica',
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
    // check for contact permissions before letting the user advance
    const contactPerms = PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);

    if (contactPerms === PermissionsAndroid.RESULTS.GRANTED) {
      // permission granted, proceed
      this.loadContactsAndReminders();
    } else if (contactPerms === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      // permission permanently denied
      Main.alertForContactPermsDenied();
    } else {
      // ask for permission
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS)
        .then(result => {
          if (result === PermissionsAndroid.RESULTS.GRANTED) {
            // permissiong granted, proceed
            this.loadContactsAndReminders();
          } else {
            // permission denied
            Main.alertForContactPermsDenied();
          }
        })
        .catch(error => {
          Main.alertForContactPermsDenied();
          rollbar.log(`Error getting contact permissions (${error})`);
        });
    }
  }

  static alertForContactPermsDenied() {
    Alert.alert(`Grant Contacts Permissions in your settings for KeepInTouch.`);
  }

  // TODO: handle getting name in all cases (names missing etc.)
  static getName(contact) {
    const firstName = contact.givenName != null ? contact.givenName : '';
    const lastName = contact.familyName != null ? contact.familyName : '';
    return `${firstName} ${lastName}`;
  }

  static getStartDate(startDateString) {
    const today = new Date();
    const firstDate = new Date(today);
    firstDate.setDate(today.getDate() + mapStartDateStringToStartDateDate[startDateString]);
    if (mapStartDateStringToStartDateDate[startDateString] === 0) {
      firstDate.setHours(today.getHours() + 1);
    } else {
      // normalize to noon, allow for min/s/ms variation so as to not get bombarded
      firstDate.setHours(12);
    }
    return firstDate;
  }

  static getRepeatTime(repeatString) {
    const oneDayMilliseconds = 1000 * 60 * 60 * 24;
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
    // helps user to see their contact list up front before they start searching
    this.setState({ scopedContacts: contacts });
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

    if (searchText === '') {
      this.setState({ scopedContacts: contacts });
    } else {
      this.setState({ scopedContacts });
    }
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
        Alert.alert(`Error adding reminder for ${contactToAdd.name}`);
        rollbar.log(`Error adding reminder (${error})`);
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
      rollbar.log(`Error updating reminder (${error})`);
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
          rollbar.log(`Error deleting reminder (${error})`);
        });
    }
  };

  loadContactsAndReminders() {
    // get contacts list
    Contacts.getAll((err, contacts) => {
      if (err) {
        rollbar.log(`Error getting contacts (${err})`);
        Alert.alert(
          `Couldn't load your contacts. You won't be able to create new reminders.\nPlease allow KeepInTouch to access your contacts.`
        );
      }
      this.contactsListPrep(contacts);
    });
    // get stored reminders
    this.retrieveReminders().catch(error => {
      Alert.alert('Error loading saved reminders');
      rollbar.log(`Error loading saved reminders (${error})`);
    });
    SplashScreen.hide();
  }

  async retrieveReminders() {
    try {
      const storedReminders = await AsyncStorage.getItem('reminders');
      let reminders = JSON.parse(storedReminders);
      if (reminders == null) reminders = [];
      this.setState({ reminders });
    } catch (error) {
      throw error;
    }
  }

  async saveReminderData(updatedReminders) {
    try {
      // update stored data
      await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
      // update state
      this.setState({ reminders: updatedReminders });
    } catch (error) {
      throw error;
    }
  }

  /* TESTING ONLY */
  testReset() {
    AsyncStorage.clear();
    PushNotification.cancelAllLocalNotifications();
    this.setState({ reminders: [] });
  }

  // free version limits
  reminderButtonPressed() {
    const { reminders } = this.state;
    if (freeVersion && reminders.length >= 5) {
      Alert.alert('Please upgrade to KeepInTouch Pro (Max Reminders Set).');
    } else {
      this.setState({ contactSearchVisible: true });
    }
  }

  render() {
    const { reminders, scopedContacts, contactSearchVisible } = this.state;
    return (
      <View style={styles.container}>
        <View>
          <View style={styles.banner}>
            <Text style={styles.bannerText}>KeepInTouch</Text>
          </View>
          <Image source={require('./img/circleIcon.png')} style={styles.logoStyle} />
          <View style={styles.topActions}>
            <Button
              style={styles.addReminderButton}
              color={sharedStyles.actionButton.color}
              title="Add Reminder"
              onPress={() => this.reminderButtonPressed()}
            />
          </View>
        </View>
        <ScrollView>
          <FlatList
            style={styles.listMargins}
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
        </ScrollView>
        {freeVersion && (
          <View>
            <AdMobBanner
              style={styles.adBanner}
              adSize="smartBanner"
              adUnitID="ca-app-pub-5788032504032701/7284967342"
              onAdFailedToLoad={error => rollbar.log(`Error with Ad failing to load ${error}.`)}
            />
          </View>
        )}
        <Modal
          animationType="fade"
          transparent={false}
          visible={contactSearchVisible}
          onRequestClose={() => {
            this.setState({ contactSearchVisible: false });
          }}
        >
          <View style={styles.banner}>
            <Text style={styles.bannerText}>KeepInTouch</Text>
          </View>
          <Image source={require('./img/circleIcon.png')} style={styles.logoStyle} />
          <View style={styles.listMargins}>
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
