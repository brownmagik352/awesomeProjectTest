import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Button, Picker } from 'react-native';
import PropTypes from 'prop-types';
import {
  mapRepeatStringToRepeatTime,
  mapStartDateStringToStartDateDate,
  sharedStyles,
} from '../constants';

export default class ContactListItem extends Component {
  constructor(props) {
    super(props);
    const { phoneNumbers } = this.props;
    this.state = {
      // modal & picker variables
      pickerVisible: false,
      number: phoneNumbers.length > 0 ? phoneNumbers[0].number : '',
      startDateString: Object.keys(mapStartDateStringToStartDateDate)[0],
      repeatString: Object.keys(mapRepeatStringToRepeatTime)[2],
    };
  }

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
    return daysFromNow.map(s => <Picker.Item label={s} value={s} key={s} />);
  }

  static createPickerForRepeatTime() {
    const recurringTimes = Object.keys(mapRepeatStringToRepeatTime);
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
            <Button
              color={sharedStyles.actionButton.color}
              title="Add"
              onPress={this.handlePress}
            />
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
