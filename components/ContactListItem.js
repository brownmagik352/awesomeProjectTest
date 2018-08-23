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
    modalVisible: false,
    repeatString: 'Every Week',
    startDateString: 'One day from now',
  };

  setModalVisible(visible) {
    this.setState({ modalVisible: visible });
  }

  handlePress = () => {
    this.setModalVisible(false);
    const { parentCallbackHandleContactPress, name, number, id } = this.props;
    const { repeatString, startDateString } = this.state;
    parentCallbackHandleContactPress({ name, number, id, repeatString, startDateString });
  };

  render() {
    const { name } = this.props;
    const { modalVisible, repeatString, startDateString } = this.state;
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
              selectedValue={startDateString}
              onValueChange={itemValue => this.setState({ startDateString: itemValue })}
            >
              <Picker.Item label="One day from now" value="One day from now" />
              <Picker.Item label="Two days from now" value="Two days from now" />
              <Picker.Item label="Three days from now" value="Three days from now" />
              <Picker.Item label="Four days from now" value="Four days from now" />
              <Picker.Item label="Five days from now" value="Five days from now" />
              <Picker.Item label="Six days from now" value="Six days from now" />
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
            </Picker>
            <Button title="Test" onPress={this.handlePress} />
          </View>
        </Modal>
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
