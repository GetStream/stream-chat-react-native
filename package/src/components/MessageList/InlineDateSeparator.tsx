import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { getDateString } from '../../utils/getDateString';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  text: {
    fontSize: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});

export type InlineDateSeparatorProps = {
  date?: Date;
};

export const InlineDateSeparator = ({ date }: InlineDateSeparatorProps) => {
  const {
    theme: {
      colors: { overlay, white },
      inlineDateSeparator: { container, text },
    },
  } = useTheme();
  const { tDateTimeParser } = useTranslationContext();

  if (!date) {
    return null;
  }

  const dateFormat = date.getFullYear() === new Date().getFullYear() ? 'MMM D' : 'MMM D, YYYY';

  const dateString = getDateString({ date, format: dateFormat, tDateTimeParser });

  return (
    <View
      style={[styles.container, { backgroundColor: overlay }, container]}
      testID='date-separator'
    >
      <Text style={[styles.text, { color: white }, text]}>{dateString}</Text>
    </View>
  );
};
