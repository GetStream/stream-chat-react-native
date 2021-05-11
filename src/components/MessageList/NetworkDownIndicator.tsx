import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

const styles = StyleSheet.create({
  errorNotification: {
    alignItems: 'center',
    left: 0,
    paddingVertical: 4,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  errorNotificationText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

export const NetworkDownIndicator = () => {
  const {
    theme: {
      colors: { grey },
      messageList: { errorNotification, errorNotificationText },
    },
  } = useTheme();
  const { t } = useTranslationContext();
  const { isOnline } = useChatContext();
  const { error } = useChannelContext();

  if (isOnline && !error) {
    return null;
  }

  return (
    <View
      style={[
        styles.errorNotification,
        { backgroundColor: `${grey}E6` },
        errorNotification,
      ]}
      testID='error-notification'
    >
      <Text style={[styles.errorNotificationText, errorNotificationText]}>
        {!isOnline
          ? t('Reconnecting...')
          : error
          ? t('Error loading messages for this channel...')
          : ''}
      </Text>
    </View>
  );
};
