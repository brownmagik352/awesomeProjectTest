import React, { Component } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default class ActionableContact extends Component {
    render() {
        return (
            <View style={styles.singleRow}>
                <Text>{this.props.name}</Text>
                <Button title="Call" onPress={() => console.log("Call " + this.props.name)} />
                <Button title="Text" onPress={() => console.log("Text " + this.props.name)} />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    singleRow : {
        flexDirection: 'row',
        justifyContent: 'space-evenly'
    }
});