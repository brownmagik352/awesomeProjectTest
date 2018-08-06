import React, { Component } from 'react';
import { View, FlatList, StyleSheet, Text, Button, AsyncStorage } from 'react-native';
import ContactListItem from './ContactListItem';
import ActionableContact from './ActionableContact';
import Contacts from 'react-native-contacts';
import PushNotification from 'react-native-push-notification';

export default class Reminders extends Component {
    constructor(props) {
        super(props);
        this.state = {
            reminders: [],
            contactListVisible: false,
            contacts: []
        }; 
    }

    componentDidMount() {
        // console.log("COMPONENT DID MOUNT");
        
        // get contacts list
        Contacts.getAll((err, contacts) => {
            if (err) throw err;
          
            // contacts returned
            // console.log(contacts);

            this.setState({contacts: contacts});
        })

        // get stored reminders
        this.retrieveReminders();

        // PushNotification.localNotificationSchedule({
        //     //... You can use all the options from localNotifications
        //     message: "Test 10s", // (required)
        //     date: new Date(Date.now() + (10 * 1000))
        // });

    }

    async retrieveReminders() {
        try {
            let storedReminders = await AsyncStorage.getItem('reminders');
            let reminders = JSON.parse(storedReminders);
            if (reminders == null) {
                reminders = [];
            }
            this.setState({reminders: reminders});
        } catch (error) {
            alert('Error loading saved reminders');
            console.log(error);
            this.setState({reminders: []});
        }
        return;
    }

    handlePress(contact) {
        // update state
        let remindersList = [];
        if (this.state.reminders != null) {
            remindersList = this.state.reminders.slice();
        } 
        remindersList.push(contact);
        this.setState({reminders: remindersList}); // TODO: don't update the whole array each time

        // update stored data
        AsyncStorage.setItem("reminders", JSON.stringify(remindersList))
    }

    toggleContactListVisible() {
        if (this.state.contactListVisible) {
            this.setState({contactListVisible: false});
        } else {
            this.setState({contactListVisible: true});
        }
    }

    // TODO: handle getting name in all cases (names missing etc.)
    static getName(contact) {
        return contact.givenName + " " + contact.familyName
    }

    // TODO: handle getting name in all cases (names missing etc.)
    static getNumber(contact) {
        return contact.phoneNumbers[0].number
    }

    debugReset() {
        AsyncStorage.clear();
        this.setState({reminders: []});
    }

    render() {
        return (
            <View style={styles.container}>

                <Button title="WIPE DATA" onPress={() => this.debugReset()} />
                <FlatList
                    data = {this.state.reminders}
                    renderItem={({item}) => <ActionableContact name={item.name} number={item.number} />}
                    keyExtractor={(item, index) => item.name}
                />
                <Button title="Show/Hide Contacts" onPress={() => this.toggleContactListVisible()} />

                { this.state.contactListVisible && 
                    <FlatList
                    data={this.state.contacts}
                    renderItem={({item}) => <ContactListItem 
                                                name= {Reminders.getName(item)} 
                                                onPress={() => this.handlePress({
                                                    name: Reminders.getName(item),
                                                    number: Reminders.getNumber(item)
                                                })}
                                            />}
                    keyExtractor={(item, index) => index.toString()}
                    />
                }
            </View>
        )
    }
}

const styles=StyleSheet.create({
    container: {
        paddingTop: 50
    }
});