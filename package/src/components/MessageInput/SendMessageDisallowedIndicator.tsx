import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { primitives } from '../../theme';

export const SendMessageDisallowedIndicator = () => {
  const { t } = useTranslationContext();

  const styles = useStyles();

  return (
    <View style={styles.container} testID='send-message-disallowed-indicator'>
      <Text style={styles.text}>{t("You can't send messages in this channel")}</Text>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      messageInput: {
        sendMessageDisallowedIndicator: { container, text },
      },
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        backgroundColor: semantics.backgroundCoreApp,
        borderTopColor: semantics.borderCoreDefault,
        height: 48,
        ...container,
      },
      text: {
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightNormal,
        ...text,
      },
    });
  }, [semantics, container, text]);
};
