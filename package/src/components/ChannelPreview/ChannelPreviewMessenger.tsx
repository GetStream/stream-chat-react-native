import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { ChannelAvatar } from './ChannelAvatar';
import type { ChannelPreviewProps } from './ChannelPreview';
import { ChannelPreviewMessage } from './ChannelPreviewMessage';
import { ChannelPreviewMutedStatus } from './ChannelPreviewMutedStatus';
import { ChannelPreviewStatus } from './ChannelPreviewStatus';
import { ChannelPreviewTitle } from './ChannelPreviewTitle';
import { ChannelPreviewUnreadCount } from './ChannelPreviewUnreadCount';
import { useChannelPreviewDisplayName } from './hooks/useChannelPreviewDisplayName';

import type { LatestMessagePreview } from './hooks/useLatestMessagePreview';

import {
  ChannelsContextValue,
  useChannelsContext,
} from '../../contexts/channelsContext/ChannelsContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useViewport } from '../../hooks/useViewport';
import type { DefaultStreamChatGenerics } from '../../types/types';

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  contentContainer: { flex: 1 },
  row: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  statusContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  title: { fontSize: 14, fontWeight: '700' },
});

export type ChannelPreviewMessengerPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelPreviewProps<StreamChatGenerics>, 'channel'> &
  Pick<
    ChannelsContextValue<StreamChatGenerics>,
    | 'maxUnreadCount'
    | 'onSelect'
    | 'PreviewAvatar'
    | 'PreviewMessage'
    | 'PreviewMutedStatus'
    | 'PreviewStatus'
    | 'PreviewTitle'
    | 'PreviewUnreadCount'
  > & {
    /**
     * Latest message on a channel, formatted for preview
     *
     * e.g.,
     *
     * ```json
     * {
     *  created_at: '' ,
     *  messageObject: { ... },
     *  previews: {
     *    bold: true,
     *    text: 'This is the message preview text'
     *  },
     *  status: 0 | 1 | 2 // read states of the latest message.
     * }
     * ```
     *
     * The read status is either of the following:
     *
     * 0: The message was not sent by the current user
     * 1: The message was sent by the current user and is unread
     * 2: The message was sent by the current user and is read
     *
     * @overrideType object
     */
    latestMessagePreview: LatestMessagePreview<StreamChatGenerics>;
    /**
     * Formatter function for date of latest message.
     * @param date Message date
     * @returns Formatted date string
     *
     * By default today's date is shown in 'HH:mm A' format and other dates
     * are displayed in 'DD/MM/YY' format. props.latestMessage.created_at is the
     * default formatted date. This default logic is part of ChannelPreview component.
     */
    formatLatestMessageDate?: (date: Date) => string;
    /** Number of unread messages on the channel */
    unread?: number;
  };

const ChannelPreviewMessengerWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelPreviewMessengerPropsWithContext<StreamChatGenerics>,
) => {
  const {
    channel,
    formatLatestMessageDate,
    latestMessagePreview,
    maxUnreadCount,
    onSelect,
    PreviewAvatar = ChannelAvatar,
    PreviewMessage = ChannelPreviewMessage,
    PreviewMutedStatus = ChannelPreviewMutedStatus,
    PreviewStatus = ChannelPreviewStatus,
    PreviewTitle = ChannelPreviewTitle,
    PreviewUnreadCount = ChannelPreviewUnreadCount,
    unread,
  } = props;
  const { vw } = useViewport();

  const maxWidth = vw(80) - 16 - 40;

  const {
    theme: {
      channelPreview: { container, contentContainer, row, title },
      colors: { border, white_snow },
    },
  } = useTheme();

  const { client } = useChatContext<StreamChatGenerics>();

  const displayName = useChannelPreviewDisplayName(
    channel,
    Math.floor(maxWidth / ((title.fontSize || styles.title.fontSize) / 2)),
  );

  const [isChannelMuted, setIsChannelMuted] = useState(() => channel.muteStatus().muted);

  useEffect(() => {
    const handleEvent = () => setIsChannelMuted(channel.muteStatus().muted);

    client.on('notification.channel_mutes_updated', handleEvent);
    return () => client.off('notification.channel_mutes_updated', handleEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  return (
    <TouchableOpacity
      onPress={() => {
        if (onSelect) {
          onSelect(channel);
        }
      }}
      style={[
        styles.container,
        { backgroundColor: white_snow, borderBottomColor: border },
        container,
      ]}
      testID='channel-preview-button'
    >
      <PreviewAvatar channel={channel} />
      <View
        style={[styles.contentContainer, contentContainer]}
        testID={`channel-preview-content-${channel.id}`}
      >
        <View style={[styles.row, row]}>
          <PreviewTitle channel={channel} displayName={displayName} />
          <View style={[styles.statusContainer, row]}>
            {isChannelMuted && <PreviewMutedStatus />}
            <PreviewUnreadCount channel={channel} maxUnreadCount={maxUnreadCount} unread={unread} />
          </View>
        </View>
        <View style={[styles.row, row]}>
          <PreviewMessage latestMessagePreview={latestMessagePreview} />
          <PreviewStatus
            channel={channel}
            formatLatestMessageDate={formatLatestMessageDate}
            latestMessagePreview={latestMessagePreview}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export type ChannelPreviewMessengerProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<
  Omit<
    ChannelPreviewMessengerPropsWithContext<StreamChatGenerics>,
    'channel' | 'latestMessagePreview'
  >
> &
  Pick<
    ChannelPreviewMessengerPropsWithContext<StreamChatGenerics>,
    'channel' | 'latestMessagePreview'
  >;

const MemoizedChannelPreviewMessengerWithContext = React.memo(
  ChannelPreviewMessengerWithContext,
) as typeof ChannelPreviewMessengerWithContext;

/**
 * This UI component displays an individual preview item for each channel in a list. It also receives all props
 * from the ChannelPreview component.
 */
export const ChannelPreviewMessenger = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelPreviewMessengerProps<StreamChatGenerics>,
) => {
  const {
    forceUpdate,
    maxUnreadCount,
    onSelect,
    PreviewAvatar,
    PreviewMessage,
    PreviewMutedStatus,
    PreviewStatus,
    PreviewTitle,
    PreviewUnreadCount,
  } = useChannelsContext<StreamChatGenerics>();
  return (
    <MemoizedChannelPreviewMessengerWithContext
      {...{
        forceUpdate,
        maxUnreadCount,
        onSelect,
        PreviewAvatar,
        PreviewMessage,
        PreviewMutedStatus,
        PreviewStatus,
        PreviewTitle,
        PreviewUnreadCount,
      }}
      {...props}
    />
  );
};

ChannelPreviewMessenger.displayName = 'ChannelPreviewMessenger{channelPreview}';
