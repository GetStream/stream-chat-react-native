import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { primitives } from '../../theme';

export const InlineUnreadIndicator = () => {
  const styles = useStyles();
  const { t } = useTranslationContext();

  return (
    <View accessibilityLabel='Inline unread indicator' style={styles.container}>
      <Text style={styles.text}>{t('Unread Messages')}</Text>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: {
      messageList: {
        inlineUnreadIndicator: { container, text },
      },
      semantics,
    },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: primitives.spacingXs,
          paddingHorizontal: primitives.spacingSm,
          backgroundColor: semantics.backgroundCoreSurfaceSubtle,
          borderTopWidth: 1,
          borderTopColor: semantics.borderCoreSubtle,
          borderBottomWidth: 1,
          borderBottomColor: semantics.borderCoreSubtle,
          ...container,
        },
        text: {
          color: semantics.chatTextSystem,
          fontSize: primitives.typographyFontSizeXs,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightTight,
          ...text,
        },
      }),
    [semantics, container, text],
  );
};
