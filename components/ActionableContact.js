import React, { Component } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import call from 'react-native-phone-call';
import SendSMS from 'react-native-sms';

const styles = StyleSheet.create({
  singleRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});

export default class ActionableContact extends Component {
  render() {
    const { number, name } = this.props;
    return (
      <View style={styles.singleRow}>
        <Text>{name}</Text>
        <Button title="Call" onPress={() => call({ number, prompt: true }).catch(console.error)} />
        <Button
          title="Text"
          onPress={() =>
            SendSMS.send(
              {
                body: '',
                recipients: [number],
                successTypes: ['sent', 'queued'],
              },
              (completed, cancelled, error) => {
                console.log(
                  `SMS Callback: completed: ${completed} cancelled: ${cancelled}error: ${error}`
                );
              }
            )
          }
        />
      </View>
    );
  }
}
