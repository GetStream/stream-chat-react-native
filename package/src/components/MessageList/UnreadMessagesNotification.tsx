import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { Close } from '../../icons';

export type UnreadMessagesNotificationProps = {
  /**
   * Callback to handle the press event
   */
  onPressHandler: () => void;
  /**
   * Callback to handle the close event
   */
  onCloseHandler?: () => void;
  /**
   * If the notification is visible
   */
  visible?: boolean;
};

export const UnreadMessagesNotification = (props: UnreadMessagesNotificationProps) => {
  const { onCloseHandler, onPressHandler, visible = true } = props;
  const { t } = useTranslationContext();
  const {
    theme: {
      colors: { text_low_emphasis, white_snow },
      messageList: {
        unreadMessagesNotification: { container, closeButtonContainer, closeIcon, text },
      },
    },
  } = useTheme();

  if (!visible) return null;

  return (
    <Pressable
      onPress={onPressHandler}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: text_low_emphasis, opacity: pressed ? 0.8 : 1 },
        container,
      ]}
    >
      <Text style={[styles.text, { color: white_snow }, text]}>{t<string>('Unread Messages')}</Text>
      <Pressable
        onPress={onCloseHandler}
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
