import React from 'react';
import { View, Text } from 'react-native';
import { Avatar } from './Avatar';

export class MentionsItem extends React.Component {
  render() {
    const {
      item: { name, icon },
    } = this.props;

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar image={icon} />
        <Text style={{ padding: 10 }}>{name}</Text>
      </View>
    );
  }
}
