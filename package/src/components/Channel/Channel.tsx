import React, { PropsWithChildren, useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ChannelConfigProps, ChannelShell } from './ChannelShell';

import { useChannelLifecycle } from './hooks/useChannelLifecycle';
import { useSupersededChannelSwap } from './hooks/useSupersededChannelSwap';

import { ChannelContextValue } from '../../contexts/channelContext/ChannelContext';
import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../hooks/useStateStore';
import { primitives } from '../../theme';

import { getChannelNotificationHostId } from '../Notifications/notificationTarget';
import { NotificationTargetProvider } from '../Notifications/NotificationTargetContext';

export { reactionData } from './ChannelShell';

export type MarkReadFunctionOptions = {
  /**
   * Whether the paginator's unread snapshot is reset to the latest message. Defaults to true.
   * Marking read on mount passes false so the channel keeps showing its original unread state.
   */
  updateChannelUnreadState?: boolean;
};

export type ChannelPropsWithContext = Pick<ChannelContextValue, 'channel'> &
  Pick<ChatContextValue, 'client'> &
  Pick<TranslationContextValue, 't'> &
  ChannelConfigProps & {
    /** Scrolls the message list to the first unread message on open. Defaults to false. */
    initialScrollToFirstUnreadMessage?: boolean;
    /** Marks the channel as read on mount. Defaults to true. */
    markReadOnMount?: boolean;
    /**
     * Whether to call `channel.watch()` when a channel mounts. Defaults to true. When false, call
     * it yourself to receive WebSocket events, such as for a read-only or ephemeral channel that is
     * not created until its first message.
     */
    initializeOnMount?: boolean;
  };

const channelQuerySelector = (state: { items?: unknown[]; lastQueryError?: Error }) => ({
  blockingError: state.items?.length ? undefined : state.lastQueryError,
});

const ChannelWithContext = (props: PropsWithChildren<ChannelPropsWithContext>) => {
  const {
    channel,
    children,
    client,
    initialScrollToFirstUnreadMessage = false,
    initializeOnMount = true,
    markReadOnMount = true,
    t,
    ...shellProps
  } = props;

  const { LoadingErrorIndicator } = useComponentsContext();

  const styles = useStyles();

  const { blockingError } =
    useStateStore(channel.messagePaginator.state, channelQuerySelector) ?? {};

  const { hasPendingInitialTargetLoad } = useChannelLifecycle({
    channel,
    client,
    initialScrollToFirstUnreadMessage,
    initializeOnMount,
    markReadOnMount,
    t,
  });

  if (!channel || blockingError) {
    // A failed retry lands in the paginator's `lastQueryError`, which the indicator renders, so
    // the warning is all the handling needed.
    const retry = () =>
      channel?.messagePaginator
        ?.jumpToTheLatestMessage()
        .catch((err: unknown) =>
          console.warn('Reloading the message list failed with error:', err),
        );

    return <LoadingErrorIndicator error={blockingError} listType='message' retry={retry} />;
  }

  if (!channel?.cid || !channel.watch) {
    return (
      <Text style={styles.selectChannel} testID='no-channel'>
        {t('channel.noneSelected.text', 'Please select a channel first')}
      </Text>
    );
  }

  return (
    <ChannelShell
      {...shellProps}
      channel={channel}
      hasPendingInitialTargetLoad={hasPendingInitialTargetLoad}
    >
      {children}
    </ChannelShell>
  );
};

export type ChannelProps = Partial<Omit<ChannelPropsWithContext, 'channel'>> &
  Pick<ChannelPropsWithContext, 'channel'> & {
    /**
     * The notification host this channel's notifications are routed to. Defaults to the channel's
     * own host, derived from its `cid`.
     */
    notificationHostId?: string;
  };

/**
 * Wrapper component for a chat channel. It must be inside `<Chat>`, and `MessageList` and
 * `MessageInput` must be its children to receive the channel context. A thread is rendered by
 * `<Thread>` next to the channel, not inside it.
 *
 * @example ./Channel.md
 */
export const Channel = (props: PropsWithChildren<ChannelProps>) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const { notificationHostId: notificationHostIdProp, ...channelProps } = props;
  const channel = useSupersededChannelSwap(props.channel);
  const notificationHostId =
    notificationHostIdProp ??
    (channel?.cid ? getChannelNotificationHostId(channel.cid) : undefined);

  const channelWithContext = (
    <ChannelWithContext
      {...{
        client,
        t,
      }}
      {...channelProps}
      channel={channel}
    />
  );

  return notificationHostId ? (
    <NotificationTargetProvider hostId={notificationHostId} panel='channel'>
      {channelWithContext}
    </NotificationTargetProvider>
  ) : (
    channelWithContext
  );
};

const useStyles = () => {
  const {
    theme: {
      channel: { selectChannel },
      semantics,
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      selectChannel: {
        fontWeight: primitives.typographyFontWeightSemiBold,
        fontSize: primitives.typographyFontSizeMd,
        lineHeight: primitives.typographyLineHeightNormal,
        padding: primitives.spacingMd,
        color: semantics.textPrimary,
        ...selectChannel,
      },
    });
  }, [selectChannel, semantics]);
};
