import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useChatContext } from '../../contexts/chatContext/ChatContext';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { primitives } from '../../theme';

export const NetworkDownIndicator = () => {
  const { isOnline } = useChatContext();
  const styles = useStyles();
  const { t } = useTranslationContext();

  if (isOnline) {
    return null;
  }

  return (
    <View style={styles.container} testID='error-notification'>
      <Text style={styles.errorText}>{t('common.reconnecting.text', 'Reconnecting...')}</Text>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: {
      messageList: { errorNotification, errorNotificationText },
      semantics,
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        left: 0,
        paddingVertical: primitives.spacingXs,
        paddingHorizontal: primitives.spacingSm,
        position: 'absolute',
        right: 0,
        top: 0,
        justifyContent: 'center',
        backgroundColor: semantics.backgroundCoreSurfaceDefault,
        ...errorNotification,
      },
      errorText: {
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
        color: semantics.chatTextSystem,
        ...errorNotificationText,
      },
    });
  }, [errorNotification, errorNotificationText, semantics]);
};
