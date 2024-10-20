import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export type PollModalHeaderProps = {
  onPress: () => void;
  title: string;
};

export const PollModalHeader = ({ onPress, title }: PollModalHeaderProps) => (
  <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 18 }}>
    <TouchableOpacity onPress={onPress}>
      <Text>BACK</Text>
    </TouchableOpacity>
    <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, fontWeight: '500', marginLeft: 32 }}>
      {title}
    </Text>
  </View>
);
