import React, { useCallback, useMemo } from 'react';

import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';

import type { ReadState } from 'stream-chat';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../hooks/useStateStore';
import { primitives } from '../../theme';
import { BadgeNotification } from '../ui';
import { Button } from '../ui/Button';

export const SCROLL_TO_BOTTOM_ACCESSIBILITY_LABEL_KEY =
  'messageList.scrollToBottom.accessibilityLabel';
export const SCROLL_TO_BOTTOM_WITH_COUNT_ACCESSIBILITY_LABEL_KEY =
  'messageList.scrollToBottom.withCount.accessibilityLabel';

export type ScrollToBottomButtonProps = {
  /** onPress handler */
  onPress: () => void;
  /** If we should show the notification or not */
  showNotification?: boolean;
};

export const ScrollToBottomButton = (props: ScrollToBottomButtonProps) => {
  const { onPress, showNotification = true } = props;
  const { channel, threadList } = useChannelContext();
  const { client } = useChatContext();
  const {
    theme: { semantics },
  } = useTheme();
  const { icons } = useComponentsContext();
  const userId = client?.userID;
  const ownUnreadSelector = useCallback(
    (state: ReadState) => ({
      unreadCount: userId ? (state.read[userId]?.unread_messages ?? 0) : 0,
    }),
    [userId],
  );
  const ownRead = useStateStore(channel?.state, ownUnreadSelector);
  const unreadCount = threadList ? undefined : ownRead?.unreadCount;
  const accessibilityLabelParams = useMemo(
    () => (unreadCount ? { count: unreadCount } : undefined),
    [unreadCount],
  );

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
          accessibilityLabelKey={
            unreadCount
              ? SCROLL_TO_BOTTOM_WITH_COUNT_ACCESSIBILITY_LABEL_KEY
              : SCROLL_TO_BOTTOM_ACCESSIBILITY_LABEL_KEY
          }
          accessibilityLabelParams={accessibilityLabelParams}
          variant='secondary'
          type='outline'
          LeadingIcon={icons.Down}
          onPress={onPress}
          size='md'
          testID='scroll-to-bottom-button'
          iconOnly
        />
      </View>

      <View
        accessibilityElementsHidden
        importantForAccessibility='no-hide-descendants'
        style={styles.unreadCountNotificationContainer}
      >
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
