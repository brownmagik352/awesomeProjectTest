import React, { Component } from 'react';
import { View, Text, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import call from 'react-native-phone-call';
import SendSMS from 'react-native-sms';
import moment from 'moment';
import { Client } from 'rollbar-react-native';
import { sharedStyles, rollbarKey } from '../constants';

const rollbar = new Client(rollbarKey);

const styles = StyleSheet.create({
  reminderTopRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reminderActionGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  reminderActions: {
    height: 36,
    marginRight: 15,
  },
  reminderExtraInfo: {
    fontSize: 12,
  },
});

export default class Reminder extends Component {
  callOrText(callOrTextPressed) {
    const { reminder, parentCallbackUpdateReminder } = this.props;
    const reminderToUpdate = Object.assign({}, reminder);
    const nowLocalized = moment().format('MMMM Do YYYY');

    if (callOrTextPressed === 'Called') {
      call({ number: reminder.number, prompt: true }).catch(error =>
        rollbar.log(`Error making call (${error})`)
      );
    } else if (callOrTextPressed === 'Texted') {
      SendSMS.send(
        {
          body: '',
          recipients: [reminder.number],
          successTypes: ['sent', 'queued'],
        },
        (completed, cancelled, error) => {
          rollbar.log(`Error making text reminder (${error})`);
        }
      );
    }

    reminderToUpdate.lastContact = `${callOrTextPressed} on ${nowLocalized}`;
    parentCallbackUpdateReminder(reminderToUpdate);
  }

  optionsDialog() {
    const { reminder, parentCallbackDeleteReminder } = this.props;
    Alert.alert(reminder.name, reminder.number, [
      { text: 'Delete', onPress: () => parentCallbackDeleteReminder(reminder) },
      { text: 'Text', onPress: () => this.callOrText('Texted') },
      { text: 'Call', onPress: () => this.callOrText('Called') },
    ]);
  }

  render() {
    const { reminder } = this.props;
    let contactString;
    if (reminder.lastContact.length > 0) {
      contactString = `(${reminder.lastContact})`;
    }
    return (
      <View style={sharedStyles.listItemContainer}>
        <View style={styles.reminderTopRow}>
          <TouchableOpacity onPress={() => this.optionsDialog()}>
            <Text style={sharedStyles.listItemText}>{reminder.name}</Text>
          </TouchableOpacity>
          <View style={styles.reminderActionGroup}>
            <Button
              style={styles.reminderActions}
              color={sharedStyles.actionButton.color}
              title="Call"
              onPress={() => this.callOrText('Called')}
            />
            <Button
              style={styles.reminderActions}
              color={sharedStyles.actionButton.color}
              title="Text"
              onPress={() => this.callOrText('Texted')}
            />
          </View>
        </View>

        <View style={styles.reminderBottomRow}>
          <Text style={styles.reminderExtraInfo}>
            {reminder.repeatString} {contactString}
          </Text>
        </View>
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
