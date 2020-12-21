import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#00000099',
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  text: {
    color: '#FFFFFF',
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
      dateHeader: { container, text },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]}>
      <Text style={[styles.text, text]}>{dateString}</Text>
    </View>
  );
};
