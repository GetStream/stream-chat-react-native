import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  text: {
    fontSize: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});

export type DateHeaderProps = {
  dateString: string;
};

export const DateHeader: React.FC<DateHeaderProps> = ({ dateString }) => {
  const {
    theme: {
      colors: { overlay_dark, white },
      dateHeader: { container, text },
    },
  } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: overlay_dark }, container]}
    >
      <Text style={[styles.text, { color: white }, text]}>{dateString}</Text>
    </View>
  );
};
