import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../contexts';
import { Back } from '../../../icons';

export type PollModalHeaderProps = {
  onPress: () => void;
  title: string;
};

export const PollModalHeader = ({ onPress, title }: PollModalHeaderProps) => {
  const {
    theme: {
      colors: { black, text_high_emphasis, white },
      poll: {
        modalHeader: { container, title: titleStyle },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: white }, container]}>
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
        <Back height={24} pathFill={text_high_emphasis} viewBox='0 0 24 24' width={24} />
      </Pressable>
      <Text numberOfLines={1} style={[styles.title, { color: black }, titleStyle]}>
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
