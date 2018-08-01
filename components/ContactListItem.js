import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default class ContactListItem extends Component {

    render() {
        return (
            <View style={styles.singleRow} >
                <TouchableOpacity onPress={() => this.props.onPress()}>
                    <Text>{this.props.name}</Text>
                </TouchableOpacity>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    singleRow : {
        flexDirection: 'row',
        justifyContent: 'center'
    }
});