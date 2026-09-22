import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { addInset } from '../../hooks/useHorizontalInsets';
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
  const insets = useSafeAreaInsets();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        paddingVertical: primitives.spacingXs,
        paddingHorizontal: primitives.spacingSm,
        position: 'absolute',
        top: 0,
        justifyContent: 'center',
        backgroundColor: semantics.backgroundCoreSurfaceDefault,
        ...errorNotification,
        // Absolute child of the message list container, so its padding does not reach this.
        left: addInset(errorNotification?.left, 0, insets.left),
        right: addInset(errorNotification?.right, 0, insets.right),
      },
      errorText: {
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
        color: semantics.chatTextSystem,
        ...errorNotificationText,
      },
    });
  }, [errorNotification, errorNotificationText, semantics, insets.left, insets.right]);
};
