import React from 'react';

import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';

import { NewDown } from '../../icons/NewDown';
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

  if (!showNotification) {
    return null;
  }

  return (
    <Animated.View
      entering={ZoomIn.duration(200)}
      exiting={ZoomOut.duration(200)}
      key='scroll-to-bottom-button'
    >
      <Button
        buttonStyle='secondary'
        type='solid'
        LeadingIcon={NewDown}
        onPress={onPress}
        size='md'
        testID='scroll-to-bottom-button'
        iconOnly
        badge={true}
        badgeCount={unreadCount}
      />
    </Animated.View>
  );
};

ScrollToBottomButton.displayName = 'ScrollToBottomButton{messageList{scrollToBottomButton}}';
