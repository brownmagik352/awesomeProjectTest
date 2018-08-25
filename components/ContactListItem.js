import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Button,
  Alert,
  Picker,
} from 'react-native';
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
  singleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default class ContactListItem extends Component {
  state = {
    // modal & picker variables
    modalVisible: false,
    repeatString: 'Every day',
    startDateString: 'One day from now',
    number: '',
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
    return numberStringsUnique.map((number, index) => (
      <Picker.Item label={number} value={number} key={`${number} (${index})`} />
    ));
  }

  setModalVisible(visible) {
    this.setState({ modalVisible: visible });
  }

  handlePress = () => {
    this.setModalVisible(false);
    const { parentCallbackHandleContactPress, name, id } = this.props;
    const { repeatString, startDateString, number } = this.state;
    parentCallbackHandleContactPress({
      name,
      number,
      id,
      repeatString,
      startDateString,
      lastContact: '',
    });
  };

  render() {
    const { name, phoneNumbers } = this.props;
    const { modalVisible, repeatString, startDateString, number } = this.state;

    return (
      <View style={styles.singleRow}>
        <TouchableOpacity
          onPress={() => {
            this.setModalVisible(true);
          }}
        >
          <Text>{name}</Text>
        </TouchableOpacity>

        <Modal
          animationType="fade"
          transparent={false}
          visible={modalVisible}
          onRequestClose={() => {
            Alert.alert('Reminder Not Set');
            this.setModalVisible(false);
          }}
        >
          <View>
            <Text>Set reminder for {name}:</Text>
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
              <Picker.Item label="One day from now" value="One day from now" />
              <Picker.Item label="Two days from now" value="Two days from now" />
              <Picker.Item label="Three days from now" value="Three days from now" />
              <Picker.Item label="Four days from now" value="Four days from now" />
              <Picker.Item label="Five days from now" value="Five days from now" />
              <Picker.Item label="Six days from now" value="Six days from now" />
              <Picker.Item label="test" value="test" />
            </Picker>

            <Picker
              selectedValue={repeatString}
              onValueChange={itemValue => this.setState({ repeatString: itemValue })}
            >
              <Picker.Item label="Every day" value="Every day" />
              <Picker.Item label="Every week" value="Every week" />
              <Picker.Item label="Every two weeks" value="Every two weeks" />
              <Picker.Item label="Every three weeks" value="Every three weeks" />
              <Picker.Item label="Every four weeks" value="Every four weeks" />
              <Picker.Item label="test" value="test" />
            </Picker>
            <Button title="Add" onPress={this.handlePress} />
          </View>
        </Modal>
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
