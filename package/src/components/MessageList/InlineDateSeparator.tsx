import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { primitives } from '../../theme';
import { getDateString, getDateStringForA11y } from '../../utils/i18n/getDateString';

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
  const { t, tDateTimeParser, userLanguage } = useTranslationContext();
  const styles = useStyles();

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

  const a11yDateString = useMemo(
    () => getDateStringForA11y({ date, tDateTimeParser, userLanguage }),
    [date, tDateTimeParser, userLanguage],
  );

  return (
    <View style={styles.container} testID='date-separator'>
      <Text accessibilityLabel={a11yDateString} style={styles.text}>
        {dateString}
      </Text>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      inlineDateSeparator: { container, text },
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignSelf: 'center',
        borderRadius: primitives.radiusMax,
        paddingHorizontal: primitives.spacingSm,
        paddingVertical: primitives.spacingXxs,
        backgroundColor: semantics.backgroundCoreSurfaceSubtle,
        ...container,
      },
      text: {
        color: semantics.chatTextSystem,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
        ...text,
      },
    });
  }, [semantics, container, text]);
};
