import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Button, Picker } from 'react-native';
import PropTypes from 'prop-types';
import {
  mapRepeatStringToRepeatTime,
  mapStartDateStringToStartDateDate,
  sharedStyles,
} from '../constants';

export default class ContactListItem extends Component {
  state = {
    // modal & picker variables
    pickerVisible: false,
    startDateString: Object.keys(mapStartDateStringToStartDateDate)[0],
    repeatString: Object.keys(mapRepeatStringToRepeatTime)[1],
    number: this.props.phoneNumbers.length > 0 ? this.props.phoneNumbers[0].number : '',
  };

  // create Picker.item for phoneNumbers
  static createPickerForPhoneNumbers(phoneNumbers) {
    const numberStringsUnique = [];
    // go in reverse so first number is first in picker
    for (let i = phoneNumbers.length - 1; i >= 0; i -= 1) {
      const n = phoneNumbers[i].number;
      // only unique numbers
      if (!numberStringsUnique.includes(n)) numberStringsUnique.push(n);
    }

    return numberStringsUnique.map(number => (
      <Picker.Item label={number} value={number} key={number} />
    ));
  }

  static createPickerForStartDate() {
    const daysFromNow = Object.keys(mapStartDateStringToStartDateDate);
    /* TESTING ONLY */
    daysFromNow.push('test');
    return daysFromNow.map(s => <Picker.Item label={s} value={s} key={s} />);
  }

  static createPickerForRepeatTime() {
    const recurringTimes = Object.keys(mapRepeatStringToRepeatTime);
    /* TESTING ONLY */
    recurringTimes.push('test');
    return recurringTimes.map(s => <Picker.Item label={s} value={s} key={s} />);
  }

  handlePress = () => {
    this.setState({ pickerVisible: true });
    const { parentCallbackHandleContactPress, name, id } = this.props;
    const { startDateString, repeatString, number } = this.state;
    parentCallbackHandleContactPress({
      name,
      number,
      id,
      startDateString,
      repeatString,
      lastContact: '',
    });
  };

  render() {
    const { name, phoneNumbers } = this.props;
    const { pickerVisible, startDateString, repeatString, number } = this.state;

    return (
      <View>
        <View style={sharedStyles.listItemContainer}>
          <TouchableOpacity
            onPress={() => {
              this.setState({ pickerVisible: !pickerVisible });
            }}
          >
            <Text style={sharedStyles.listItemText}>{name}</Text>
          </TouchableOpacity>
        </View>

        {pickerVisible && (
          <View>
            <Picker
              selectedValue={number}
              onValueChange={itemValue => this.setState({ number: itemValue })}
            >
              {ContactListItem.createPickerForPhoneNumbers(phoneNumbers)}
            </Picker>
            <Picker
              selectedValue={startDateString}
              onValueChange={itemValue => this.setState({ startDateString: itemValue })}
            >
              {ContactListItem.createPickerForStartDate()}
            </Picker>

            <Picker
              selectedValue={repeatString}
              onValueChange={itemValue => this.setState({ repeatString: itemValue })}
            >
              {ContactListItem.createPickerForRepeatTime()}
            </Picker>
            <Button title="Add" onPress={this.handlePress} />
          </View>
        )}
      </View>
    );
  }
}

ContactListItem.propTypes = {
  name: PropTypes.string.isRequired,
  phoneNumbers: PropTypes.arrayOf(PropTypes.shape({ number: PropTypes.string.isRequired }))
    .isRequired,
  id: PropTypes.number.isRequired,
  parentCallbackHandleContactPress: PropTypes.func.isRequired,
};
