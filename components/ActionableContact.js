import React, { Component } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import call from 'react-native-phone-call';
import SendSMS from 'react-native-sms';

export default class ActionableContact extends Component {
    render() {
        return (
            <View style={styles.singleRow}>
                <Text>{this.props.name}</Text>
                <Button title="Call" onPress={() => call({number: this.props.number, prompt: true}).catch(console.error)} />
                <Button title="Text" onPress={() => SendSMS.send({
                    body: '',
                    recipients: [this.props.number],
                    successTypes: ['sent', 'queued']
                }, (completed, cancelled, error) => {             
                    console.log('SMS Callback: completed: ' + completed + ' cancelled: ' + cancelled + 'error: ' + error);
                })} />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    singleRow : {
        flexDirection: 'row',
        justifyContent: 'space-evenly'
    }
});