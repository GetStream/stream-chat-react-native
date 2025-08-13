import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { Close } from '../../icons';

export type UnreadMessagesNotificationProps = {
  /**
   * Callback to handle the close event
   */
  onCloseHandler?: () => void;
  /**
   * Callback to handle the press event
   */
  onPressHandler?: () => Promise<void>;
};

export const UnreadMessagesNotification = (props: UnreadMessagesNotificationProps) => {
  const { onCloseHandler, onPressHandler } = props;
  const { t } = useTranslationContext();
  const {
    channelUnreadState,
    loadChannelAtFirstUnreadMessage,
    markRead,
    setChannelUnreadState,
    setTargetedMessage,
  } = useChannelContext();

  const handleOnPress = async () => {
    if (onPressHandler) {
      await onPressHandler();
    } else {
      await loadChannelAtFirstUnreadMessage({
        channelUnreadState,
        setChannelUnreadState,
        setTargetedMessage,
      });
    }
  };

  const handleClose = async () => {
    if (onCloseHandler) {
      await onCloseHandler();
    } else {
      await markRead();
    }
  };

  const {
    theme: {
      colors: { text_low_emphasis, white_snow },
      messageList: {
        unreadMessagesNotification: { closeButtonContainer, closeIcon, container, text },
      },
    },
  } = useTheme();

  return (
    <Pressable
      onPress={handleOnPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: text_low_emphasis, opacity: pressed ? 0.8 : 1 },
        container,
      ]}
    >
      <Text style={[styles.text, { color: white_snow }, text]}>{t('Unread Messages')}</Text>
      <Pressable
        onPress={handleClose}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.8 : 1,
          },
          closeButtonContainer,
        ]}
      >
        <Close pathFill={white_snow} {...closeIcon} />
      </Pressable>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 20,
    elevation: 4,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    top: 8,
  },
  text: {
    fontWeight: '500',
    marginRight: 8,
  },
});
