import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
  singleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default class ContactListItem extends Component {
  handlePress = () => {
    const { parentCallbackHandleContactPress, name, number, id } = this.props;
    parentCallbackHandleContactPress({ name, number, id });
  };

  render() {
    const { name } = this.props;
    return (
      <View style={styles.singleRow}>
        <TouchableOpacity onPress={this.handlePress}>
          <Text>{name}</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

ContactListItem.propTypes = {
  name: PropTypes.string.isRequired,
  number: PropTypes.string.isRequired,
  id: PropTypes.number.isRequired,
  parentCallbackHandleContactPress: PropTypes.func.isRequired,
};
