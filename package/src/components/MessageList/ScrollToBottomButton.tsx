import React from 'react';
import { StyleSheet, View } from 'react-native';

import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { NewDown } from '../../icons/NewDown';
import { BadgeNotification } from '../ui';
import { IconButton } from '../ui/IconButton';

const styles = StyleSheet.create({
  unreadCountNotificationContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  container: {
    padding: 4,
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
      messageList: {
        scrollToBottomButton: { container },
      },
    },
  } = useTheme();

  if (!showNotification) {
    return null;
  }

  return (
    <View style={styles.container}>
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
      <View style={styles.unreadCountNotificationContainer}>
        {unreadCount ? (
          <BadgeNotification count={unreadCount} size='md' type='primary' testID='unread-count' />
        ) : null}
      </View>
    </View>
  );
};

ScrollToBottomButton.displayName = 'ScrollToBottomButton{messageList{scrollToBottomButton}}';
