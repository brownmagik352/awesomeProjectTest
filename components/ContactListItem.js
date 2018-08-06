import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  singleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default class ContactListItem extends Component {
  render() {
    const { onPress, name } = this.props;
    return (
      <View style={styles.singleRow}>
        <TouchableOpacity onPress={() => onPress()}>
          <Text>{name}</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
