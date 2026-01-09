import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { NewDown } from '../../icons/NewDown';
import { IconButton } from '../ui/IconButton';

const styles = StyleSheet.create({
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
});

export type ScrollToBottomButtonProps = {
  /** onPress handler */
  onPress: () => void;
  /** If we should show the notification or not */
  showNotification?: boolean;
  unreadCount?: number;
};

export const ScrollToBottomButton = (props: ScrollToBottomButtonProps) => {
  const { onPress, showNotification = true, unreadCount } = props;

  const {
    theme: {
      colors: { accent_blue, white },
      messageList: {
        scrollToBottomButton: {
          container,
          unreadCountNotificationContainer,
          unreadCountNotificationText,
        },
      },
    },
  } = useTheme();

  if (!showNotification) {
    return null;
  }

  return (
    <>
      <Animated.View
        entering={ZoomIn.duration(200)}
        exiting={ZoomOut.duration(200)}
        key='scroll-to-bottom-button'
      >
        <IconButton
          Icon={NewDown}
          onPress={onPress}
          size='md'
          style={container}
          testID='scroll-to-bottom-button'
          type='secondary'
        />
      </Animated.View>
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
    </>
  );
};

ScrollToBottomButton.displayName = 'ScrollToBottomButton{messageList{scrollToBottomButton}}';
