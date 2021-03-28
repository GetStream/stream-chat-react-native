import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  isDayOrMoment,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

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

export type InlineDateIndicatorProps = {
  date?: Date;
};

export const InlineDateIndicator: React.FC<InlineDateIndicatorProps> = ({
  date,
}) => {
  const {
    theme: {
      colors: { overlay_dark, white },
      inlineDateIndicator: { container, text },
    },
  } = useTheme();
  const { tDateTimeParser } = useTranslationContext();

  if (!date) {
    return null;
  }

  const dateFormat =
    date.getFullYear() === new Date().getFullYear() ? 'MMM D' : 'MMM D, YYYY';
  const tDate = tDateTimeParser(date);
  const dateString = isDayOrMoment(tDate)
    ? tDate.format(dateFormat)
    : new Date(tDate).toDateString();

  return (
    <View
      style={[styles.container, { backgroundColor: overlay_dark }, container]}
    >
      <Text style={[styles.text, { color: white }, text]}>{dateString}</Text>
    </View>
  );
};
