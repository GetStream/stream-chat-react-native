import React, { PropsWithChildren, useEffect, useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ChannelConfigProps, ChannelShell } from './ChannelShell';

import { useSupersededChannelSwap } from './hooks/useSupersededChannelSwap';

import { ChannelContextValue } from '../../contexts/channelContext/ChannelContext';
import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../hooks';
import { useStateStore } from '../../hooks/useStateStore';
import { primitives } from '../../theme';

import { useMarkRead } from '../MessageList/hooks/useMarkRead';
import { DEFAULT_HIGHLIGHT_DURATION } from '../MessageList/hooks/useMessageListFocus';
import { useNotificationApi } from '../Notifications';
import { getChannelNotificationHostId } from '../Notifications/notificationTarget';
import { NotificationTargetProvider } from '../Notifications/NotificationTargetContext';

export { reactionData } from './ChannelShell';

export type MarkReadFunctionOptions = {
  /**
   * Signal, whether the message paginator's unread snapshot should be updated.
   * By default, the local state update is prevented when the Channel component is mounted.
   * This is in order to keep the UI indicating the original unread state, when the user opens a channel.
   */
  updateChannelUnreadState?: boolean;
};

/**
 * Initial message-list page size. stream-chat's `MessagePaginator` defaults to 100
 * (`DEFAULT_CHANNEL_MESSAGE_LIST_PAGE_SIZE`). On native that makes the initial load — and therefore
 * every subsequent message-list commit, whose cost scales with the number of loaded messages — several
 * times heavier than necessary. We keep it to a screenful-plus-buffer; older messages load on demand
 * via pagination. Mirrors the SDK's historical initial-load size.
 */
const DEFAULT_MESSAGE_LIST_PAGE_SIZE = 25;

export type ChannelPropsWithContext = Pick<ChannelContextValue, 'channel'> &
  Pick<ChatContextValue, 'client'> &
  Pick<TranslationContextValue, 't'> &
  ChannelConfigProps & {
    /**
     * When true, messageList will be scrolled at first unread message, when opened.
     */
    initialScrollToFirstUnreadMessage?: boolean;
    /**
     * Boolean flag to enable/disable marking the channel as read on mount
     */
    markReadOnMount?: boolean;
    /**
     * A boolean signifying whether the Channel component should run channel.watch()
     * whenever it mounts up a new channel. If set to `false`, it is the integrator's
     * responsibility to run channel.watch() if they wish to receive WebSocket events
     * for that channel.
     *
     * Can be particularly useful whenever we are viewing channels in a read-only mode
     * or perhaps want them in an ephemeral state (i.e not created until the first message
     * is sent).
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

  const { addNotification } = useNotificationApi();

  const notifyJumpToFirstUnreadError = useStableCallback((error: unknown) => {
    addNotification({
      message: t(
        'channel.jumpToFirstUnreadFailed.error',
        'Failed to jump to the first unread message',
      ),
      options: {
        ...(error instanceof Error ? { originalError: error } : {}),
        severity: 'error',
        type: 'channel:jumpToFirstUnread:failed',
      },
      origin: { context: { feature: 'jumpToFirstUnread' }, emitter: 'Channel' },
    });
  });

  /**
   * Whether this list is already aimed at a message.
   *
   * There is no `messageId` prop any more: jumping is the paginator's job, so an integrator targets a
   * message by calling `paginator.jumpToMessage(...)` — from a `useLayoutEffect`, or before this
   * mounts at all — and the focus signal is what that leaves behind. `<Channel>` reads the signal so
   * it can tell a jump already happened and not overwrite it with its own jump to the first unread.
   *
   * A `useLayoutEffect` is early enough: the one consumer that races this
   * (`MessageFlashList`'s initial anchor) asks inside a passive `useEffect`, which React runs after
   * every layout effect.
   *
   * Read imperatively, not through `useStateStore`: every caller is an effect or a one-shot
   * decision, and subscribing would re-render `Channel` on every jump for no benefit.
   */
  const hasFocusTarget = useStableCallback(
    () => !!channel.messagePaginator.messageFocusSignal.getLatestValue().signal,
  );

  const shouldLoadInitialChannelAtFirstUnreadMessage = useStableCallback((unreadCount?: number) => {
    if (hasFocusTarget() || !initialScrollToFirstUnreadMessage || !client.user) {
      return false;
    }

    return (unreadCount ?? channel.countUnread()) > 0;
  });

  const hasPendingInitialTargetLoad = useStableCallback(() => {
    return hasFocusTarget() || shouldLoadInitialChannelAtFirstUnreadMessage();
  });

  useEffect(() => {
    const initChannel = async () => {
      const unreadCount = channel.countUnread();
      const shouldLoadAtFirstUnread = shouldLoadInitialChannelAtFirstUnreadMessage(unreadCount);
      if (!channel) {
        return;
      }

      // a draft has no id and is marked initialized and querying it would create it on the server
      if (channel.isProvisional && channel.initialized) {
        return;
      }

      // Keep the message-list page light: the list's per-update commit cost scales with the number
      // of loaded messages, and the paginator otherwise defaults to a 100-message page.
      channel.messagePaginator.pageSize = DEFAULT_MESSAGE_LIST_PAGE_SIZE;

      if (
        (!channel.initialized || !channel.messagePaginator.isActiveIntervalAtHead) &&
        initializeOnMount
      ) {
        try {
          await channel?.watch();
        } catch (err) {
          console.warn('Channel watch request failed with error:', err);
          channel.offlineMode = true;
        }
      }

      // Seed the paginator for a cold open (deep link / push). Channels reached via the channel
      // list are already seeded by client.hydrateChannels, so guard on an empty paginator
      // to avoid a redundant fetch.
      if (!channel.messagePaginator.state.getLatestValue().items?.length) {
        await channel.messagePaginator.reload();
      }

      // Re-seed the unread snapshot from the CURRENT read state on every open. The paginator is
      // usually reused from cache (the reload above is skipped), and hydrateChannels merges
      // rather than re-seeds, so without this the snapshot's boundary/count/first-unread stay frozen
      // at the very first open — making the separator, the "N new" banner and the jump-to-first-unread
      // target all go stale on reopen. Mirrors stream-chat-react, which re-seeds by re-querying on open.
      channel.messagePaginator.seedUnreadSnapshot();

      if (shouldLoadAtFirstUnread) {
        try {
          // jumpToTheFirstUnreadMessage resolves the first-unread id from the paginator's snapshot,
          // and emits messageFocusSignal for the highlight + scroll.
          await channel.messagePaginator.jumpToTheFirstUnreadMessage({
            focusSignalTtlMs: DEFAULT_HIGHLIGHT_DURATION,
          });
        } catch (error) {
          notifyJumpToFirstUnreadError(error);
        }
      }

      if (unreadCount > 0 && markReadOnMount) {
        // Keep the original unread UI (separator frozen at the boundary, "N new" banner) when
        // opening a channel with unreads — don't reset the snapshot here. It clears once the user
        // catches up (a subsequent markRead with the default updateChannelUnreadState: true).
        await markRead({ updateChannelUnreadState: false });
      }
    };

    initChannel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  // Mark the channel active while this <Channel> is mounted. The LLC refcounts `active`, so a
  // Channel instance shared with the channel-list preview stays active until the last
  // mount unmounts. Being active enables auto-mark-read-on-focus and suppresses destructive
  // channel-list re-seeding of the open channel's message list on reconnect. `activate()` returns
  // the release for this exact activation, so swapping the `channel` prop releases the previous
  // instance before activating the new one.
  useEffect(() => channel?.activate(), [channel]);

  /**
   * CHANNEL METHODS
   */
  // markRead is no longer placed on the ChannelContext; the message lists own their own throttled
  // instance via useMarkRead(channel). Channel still needs it internally (mark-read-on-mount + resync).
  const markRead = useMarkRead(channel);

  // Mark-read after the LLC's reconnect reload. `connection.recovered` is dispatched by
  // `client.connectionRecovery` once that reload has landed, so `hasMoreHead` read here reflects the
  // refreshed window — which is why this cannot hang off the socket's status store, which moves the
  // moment the socket does. Only the reload moved into the LLC; whether a caught-up channel is
  // marked read stays a UI decision (see `useMarkRead`).
  useEffect(() => {
    // Mark read has to wait for `connection.recovered`, as it is dispatched once the reloads have
    // landed, so `hasMoreHead` read here reflects the refreshed window. Channel view only, and only
    // when that window is at the newest, only if the user has paginated up into older history so leave
    // their read state alone.
    const { unsubscribe } = client.on('connection.recovered', () => {
      if (channel.messagePaginator.hasMoreHead) {
        return;
      }
      markRead();
    });

    return unsubscribe;
  }, [channel, client, markRead]);

  if (!channel || blockingError) {
    // Retry re-runs the query that failed. A new failure lands in the paginator's `lastQueryError`,
    // which is the `error` this indicator renders off — so the warn is all the handling needed.
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
     * own host, derived from its cid.
     */
    notificationHostId?: string;
  };

/**
 *
 * The wrapper component for a chat channel. Channel needs to be placed inside a Chat component
 * to receive the StreamChat client instance. MessageList and MessageComposer must be children of
 * the Channel component to receive the ChannelContext. A thread is rendered by `<Thread>`, next to
 * the channel rather than inside it.
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
