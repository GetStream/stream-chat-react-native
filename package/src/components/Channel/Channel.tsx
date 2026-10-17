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
   * Signal, whether the message paginator's unread snapshot should be updated.
   * By default, the local state update is prevented when the Channel component is mounted.
   * This is in order to keep the UI indicating the original unread state, when the user opens a channel.
   */
  updateChannelUnreadState?: boolean;
};

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

  const { hasPendingInitialTargetLoad } = useChannelLifecycle({
    channel,
    client,
    initialScrollToFirstUnreadMessage,
    initializeOnMount,
    markReadOnMount,
    t,
  });

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
