import React, { Component } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
  singleRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});

export default class Reminder extends Component {
  render() {
    const { name, lastContact, onPressCall, onPressText } = this.props;
    return (
      <View style={styles.singleRow}>
        <Text>{name}</Text>
        <Button title="Call" onPress={() => onPressCall()} />
        <Button title="Text" onPress={() => onPressText()} />
        <Text>{lastContact}</Text>
      </View>
    );
  }
}

Reminder.propTypes = {
  name: PropTypes.string.isRequired,
  lastContact: PropTypes.string.isRequired,
  onPressCall: PropTypes.func.isRequired,
  onPressText: PropTypes.func.isRequired,
};