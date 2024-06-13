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

/**
 * Props for the `InlineDateSeparator` component.
 */
export type InlineDateSeparatorProps = {
  /**
   * Date to be displayed.
   */
  date?: Date;
  /*
   * Lookup key in the language corresponding translations sheet to perform date formatting
   */
  timestampTranslationKey?: string;
};

export const InlineDateSeparator = ({
  date,
  timestampTranslationKey = 'timestamp/InlineDateSeparator',
}: InlineDateSeparatorProps) => {
  const {
    theme: {
      colors: { overlay, white },
      inlineDateSeparator: { container, text },
    },
  } = useTheme();
  const { t, tDateTimeParser } = useTranslationContext();

  if (!date) {
    return null;
  }

  const dateString = getDateString({
    date,
    t,
    tDateTimeParser,
    timestampTranslationKey,
  });

  return (
    <View
      style={[styles.container, { backgroundColor: overlay }, container]}
      testID='date-separator'
    >
      <Text style={[styles.text, { color: white }, text]}>{dateString}</Text>
    </View>
  );
};
