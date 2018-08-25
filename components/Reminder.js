import React, { Component } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import call from 'react-native-phone-call';
import SendSMS from 'react-native-sms';
import moment from 'moment';

const styles = StyleSheet.create({
  singleRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});

export default class Reminder extends Component {
  callOrText(callOrTextPressed) {
    const { reminder, parentCallbackUpdateReminder } = this.props;
    const reminderToUpdate = Object.assign({}, reminder);
    const nowLocalized = moment().format('MMMM Do YYYY');

    if (callOrTextPressed === 'Called') {
      call({ number: reminder.number, prompt: true }).catch(console.error);
    } else if (callOrTextPressed === 'Texted') {
      SendSMS.send(
        {
          body: '',
          recipients: [reminder.number],
          successTypes: ['sent', 'queued'],
        },
        (completed, cancelled, error) => {
          console.log(
            `SMS Callback: completed: ${completed} cancelled: ${cancelled}error: ${error}`
          );
        }
      );
    }

    reminderToUpdate.lastContact = `${callOrTextPressed} on ${nowLocalized}`;
    parentCallbackUpdateReminder(reminderToUpdate);
  }

  render() {
    const { reminder, parentCallbackDeleteReminder } = this.props;
    return (
      <View>
        <View style={styles.singleRow}>
          <Text>
            {reminder.name} - {reminder.repeatString}
          </Text>
          <Button title="Call" onPress={() => this.callOrText('Called')} />
          <Button title="Text" onPress={() => this.callOrText('Texted')} />
          <Button title="X" onPress={() => parentCallbackDeleteReminder(reminder)} />
        </View>
        <Text>{reminder.lastContact}</Text>
      </View>
    );
  }
}

Reminder.propTypes = {
  reminder: PropTypes.shape({
    name: PropTypes.string.isRequired,
    number: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired,
    repeatString: PropTypes.string.isRequired,
    startDateString: PropTypes.string.isRequired,
    lastContact: PropTypes.string.isRequired,
  }).isRequired,
  parentCallbackUpdateReminder: PropTypes.func.isRequired,
  parentCallbackDeleteReminder: PropTypes.func.isRequired,
};
