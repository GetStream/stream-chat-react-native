import React from 'react';
import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Down } from '../../icons';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 20,
    elevation: 5,
    height: 40,
    justifyContent: 'center',
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: 40,
  },
  touchable: {
    bottom: 20,
    position: 'absolute',
    right: 20,
  },
  unreadCountNotificationContainer: {
    alignItems: 'center',
    borderRadius: 10,
    elevation: 6,
    height: 20,
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: 4,
    position: 'absolute',
    top: 0,
  },
  unreadCountNotificationText: {
    fontSize: 11,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  wrapper: {
    alignItems: 'center',
    height: 50,
    justifyContent: 'flex-end',
  },
});

export type ScrollToBottomButtonProps = {
  /** onPress handler */
  onPress: (event: GestureResponderEvent) => void;
  /** If we should show the notification or not */
  showNotification?: boolean;
  unreadCount?: number;
};

export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = (props) => {
  const { onPress, showNotification = true, unreadCount } = props;

  const {
    theme: {
      colors: { accent_blue, black, white },
      messageList: {
        scrollToBottomButton: {
          container,
          touchable,
          unreadCountNotificationContainer,
          unreadCountNotificationText,
          wrapper,
        },
      },
    },
  } = useTheme();

  if (!showNotification) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.touchable, touchable]}
      testID='message-notification'
    >
      <View style={[styles.wrapper, wrapper]}>
        <View style={[styles.container, { backgroundColor: white, shadowColor: black }, container]}>
          <Down />
        </View>
        {!!unreadCount && (
          <View
            style={[
              styles.unreadCountNotificationContainer,
              { backgroundColor: accent_blue },
              unreadCountNotificationContainer,
            ]}
          >
            <Text
              style={[
                styles.unreadCountNotificationText,
                { color: white },
                unreadCountNotificationText,
              ]}
              testID='unread-count'
            >
              {unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

ScrollToBottomButton.displayName = 'ScrollToBottomButton{messageList{scrollToBottomButton}}';
