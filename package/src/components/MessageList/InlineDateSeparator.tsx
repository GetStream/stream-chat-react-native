import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { getDateString } from '../../utils/i18n/getDateString';

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
};

export const InlineDateSeparator = ({ date }: InlineDateSeparatorProps) => {
  const {
    theme: {
      colors: { overlay, white },
      inlineDateSeparator: { container, text },
    },
  } = useTheme();
  const { t, tDateTimeParser } = useTranslationContext();

  const dateString = useMemo(
    () =>
      getDateString({
        date,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp/InlineDateSeparator',
      }),
    [date, t, tDateTimeParser],
  );

  return (
    <View
      style={[styles.container, { backgroundColor: overlay }, container]}
      testID='date-separator'
    >
      <Text style={[styles.text, { color: white }, text]}>{dateString}</Text>
    </View>
  );
};
