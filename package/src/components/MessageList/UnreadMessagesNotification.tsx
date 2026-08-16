import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { UnreadSnapshotState } from 'stream-chat';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../hooks/useStateStore';
import { primitives } from '../../theme';
import { MarkReadFunctionOptions } from '../Channel/Channel';
import { Button } from '../ui';

export type UnreadMessagesNotificationProps = {
  /**
   * Marks the channel as read. Passed down from the message list so the notification shares the
   * list's throttled `markRead` instance.
   */
  markRead?: (options?: MarkReadFunctionOptions) => void;
  /**
   * Callback to handle the close event
   */
  onCloseHandler?: () => void;
  /**
   * Callback to handle the press event
   */
  onPressHandler?: () => Promise<void>;
  /**
   * Unread count
   */
  unreadCount?: number;
};

const unreadCountSelector = (snapshot: UnreadSnapshotState) => ({
  unread_messages: snapshot.unreadCount,
});

export const UnreadMessagesNotification = (props: UnreadMessagesNotificationProps) => {
  const { markRead, onCloseHandler, onPressHandler, unreadCount } = props;
  const { t } = useTranslationContext();
  const { icons } = useComponentsContext();
  const { channel, loadChannelAtFirstUnreadMessage } = useChannelContext();
  const { unread_messages } = useStateStore(
    channel.messagePaginator.unreadStateSnapshot,
    unreadCountSelector,
  );

  const count = unread_messages ?? unreadCount;

  const handleOnPress = async () => {
    if (onPressHandler) {
      await onPressHandler();
    } else {
      await loadChannelAtFirstUnreadMessage();
    }
  };

  const handleClose = async () => {
    if (onCloseHandler) {
      await onCloseHandler();
    } else {
      await markRead?.();
    }
  };

  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.leftButtonContainer}>
        <Button
          variant='secondary'
          type='ghost'
          LeadingIcon={icons.ArrowUp}
          label={
            count
              ? t('messageList.unreadMessages.withCount.label', '{{count}} unread', { count })
              : t('messageList.unreadMessages.label', 'Unread Messages')
          }
          onPress={handleOnPress}
          size='md'
        />
      </View>
      <View style={styles.rightButtonContainer}>
        <Button
          accessibilityLabelKey='messageList.dismissUnread.accessibilityLabel'
          variant='secondary'
          type='ghost'
          iconOnly
          LeadingIcon={icons.NewClose}
          onPress={handleClose}
          size='md'
        />
      </View>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: {
      messageList: {
        unreadMessagesNotification: { container, leftButtonContainer, rightButtonContainer },
      },
      semantics,
    },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          borderRadius: primitives.radiusMax,
          borderWidth: 1,
          borderColor: semantics.borderCoreDefault,
          backgroundColor: semantics.backgroundCoreApp,
          flexDirection: 'row',
          alignItems: 'center',
          ...primitives.lightElevation4,
          ...container,
        },
        leftButtonContainer: {
          flexShrink: 0,
          borderRightWidth: 1,
          borderRightColor: semantics.borderCoreDefault,
          ...leftButtonContainer,
        },
        rightButtonContainer: {
          flexShrink: 0,
          ...rightButtonContainer,
        },
      }),
    [semantics, container, leftButtonContainer, rightButtonContainer],
  );
};
