import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Back } from '../../../icons';

export type PollModalHeaderProps = {
  onPress: () => void;
  title: string;
};

export const PollModalHeader = ({ onPress, title }: PollModalHeaderProps) => (
  <View
    style={{
      alignItems: 'center',
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 18,
    }}
  >
    <TouchableOpacity onPress={onPress}>
      <Back height={24} pathFill={'#080707'} viewBox='0 0 24 24' width={24} />
    </TouchableOpacity>
    <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '500', marginLeft: 32 }}>
      {title}
    </Text>
  </View>
);
