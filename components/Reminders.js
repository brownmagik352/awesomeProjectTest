import React, { Component } from 'react';
import { View, FlatList, StyleSheet, Text, Button } from 'react-native';
import ContactListItem from './ContactListItem';
import ActionableContact from './ActionableContact';
import Contacts from 'react-native-contacts';

export default class Reminders extends Component {
    constructor(props) {
        super(props);
        this.state = {
            chosen: [],
            contactListVisible: false,
            contacts: [
                {name: 'Aaron', number: '123-456-7890'},
                {name: 'Betty', number: '234-567-8901'},
                {name: 'Charlie', number: '345-678-9012'},
                {name: 'Dave', number: '456-789-0123'}
            ]
        }; 
    }

    componentDidMount() {
        console.log("COMPONENT DID MOUNT");
        Contacts.getAll((err, contacts) => {
            if (err) throw err;
          
            // contacts returned
            // console.log(contacts);

            this.setState({contacts: contacts});
        })
    }

    handlePress(contact) {
        const chosenNames = this.state.chosen.slice();
        chosenNames.push(contact);
        this.setState({chosen: chosenNames});
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

    render() {
        return (
            <View style={styles.container}>
                <FlatList
                    data = {this.state.chosen}
                    renderItem={({item}) => <ActionableContact name={item.name} number={item.number} />}
                    ListEmptyComponent={<Text>No Reminders Set</Text>}
                    keyExtractor={(item, index) => index.toString()}
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