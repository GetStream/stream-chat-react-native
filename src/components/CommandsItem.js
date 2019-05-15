import React from 'react';
import { View, Text } from 'react-native';

export class CommandsItem extends React.Component {
  render() {
    const {
      item: { name, args, description },
    } = this.props;

    return (
      <View style={{ flexDirection: 'column', padding: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontWeight: 'bold' }}>/{name} </Text>
          <Text>{args}</Text>
        </View>
        <Text>{description}</Text>
      </View>
    );
  }
}
