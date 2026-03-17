import React from 'react';

import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Down } from '../../icons/Down';
import { primitives } from '../../theme';
import { BadgeNotification } from '../ui';
import { Button } from '../ui/Button';

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
    theme: { semantics },
  } = useTheme();

  if (!showNotification) {
    return null;
  }

  return (
    <Animated.View
      entering={ZoomIn.duration(200)}
      exiting={ZoomOut.duration(200)}
      style={styles.container}
      key='scroll-to-bottom-button'
    >
      <View
        style={[
          styles.floatingButtonContainer,
          primitives.lightElevation1,
          { backgroundColor: semantics.backgroundCoreElevation1 },
        ]}
      >
        <Button
          variant='secondary'
          type='outline'
          LeadingIcon={Down}
          onPress={onPress}
          size='md'
          testID='scroll-to-bottom-button'
          iconOnly
        />
      </View>

      <View style={styles.unreadCountNotificationContainer}>
        {unreadCount ? (
          <BadgeNotification count={unreadCount} size='xs' type='primary' testID='unread-count' />
        ) : null}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  unreadCountNotificationContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  floatingButtonContainer: {
    borderRadius: primitives.radiusMax,
  },
  container: {
    padding: primitives.spacingXxs,
  },
});

ScrollToBottomButton.displayName = 'ScrollToBottomButton{messageList{scrollToBottomButton}}';
