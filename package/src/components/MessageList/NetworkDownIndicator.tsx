import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { primitives } from '../../theme';

export const NetworkDownIndicator = () => {
  const { error } = useChannelContext();
  const { isOnline } = useChatContext();
  const styles = useStyles();
  const { t } = useTranslationContext();

  const indicatorText = useMemo(() => {
    if (!isOnline) {
      return t('Reconnecting...');
    } else if (error) {
      return t('Error loading messages for this channel...');
    }
    return '';
  }, [error, isOnline, t]);

  if (!indicatorText) {
    return null;
  }

  return (
    <View style={styles.container} testID='error-notification'>
      <Text style={styles.errorText}>{indicatorText}</Text>
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
        backgroundColor: semantics.backgroundCoreSurface,
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
