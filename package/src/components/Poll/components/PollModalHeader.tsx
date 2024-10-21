import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../../contexts';
import { Back } from '../../../icons';

export type PollModalHeaderProps = {
  onPress: () => void;
  title: string;
};

export const PollModalHeader = ({ onPress, title }: PollModalHeaderProps) => {
  const {
    theme: {
      colors: { text_high_emphasis },
      poll: {
        modalHeader: { container, title: titleStyle },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]}>
      <TouchableOpacity onPress={onPress}>
        <Back height={24} pathFill={text_high_emphasis} viewBox='0 0 24 24' width={24} />
      </TouchableOpacity>
      <Text numberOfLines={1} style={[styles.title, titleStyle]}>
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  title: { fontSize: 16, fontWeight: '500', marginLeft: 32 },
});
