import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ChannelPreviewProps } from './ChannelPreview';
import { ChannelPreviewMessage } from './ChannelPreviewMessage';
import { ChannelPreviewMutedStatus } from './ChannelPreviewMutedStatus';
import { ChannelPreviewStatus } from './ChannelPreviewStatus';
import { ChannelPreviewTitle } from './ChannelPreviewTitle';
import { ChannelPreviewUnreadCount } from './ChannelPreviewUnreadCount';

import { LastMessageType } from './hooks/useChannelPreviewData';

import {
  ChannelsContextValue,
  useChannelsContext,
} from '../../contexts/channelsContext/ChannelsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';
import { ChannelAvatar } from '../ui/Avatar/ChannelAvatar';

export type ChannelPreviewMessengerPropsWithContext = Pick<ChannelPreviewProps, 'channel'> &
  Pick<
    ChannelsContextValue,
    | 'maxUnreadCount'
    | 'onSelect'
    | 'PreviewAvatar'
    | 'PreviewMessage'
    | 'PreviewMutedStatus'
    | 'PreviewStatus'
    | 'PreviewTitle'
    | 'PreviewUnreadCount'
    | 'mutedStatusPosition'
  > & {
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
    /** If the channel is muted. */
    muted?: boolean;
    /** Number of unread messages on the channel */
    unread?: number;
    lastMessage?: LastMessageType;
  };

const ChannelPreviewMessengerWithContext = (props: ChannelPreviewMessengerPropsWithContext) => {
  const {
    channel,
    formatLatestMessageDate,
    maxUnreadCount,
    muted,
    onSelect,
    PreviewAvatar = ChannelAvatar,
    PreviewMessage = ChannelPreviewMessage,
    PreviewMutedStatus = ChannelPreviewMutedStatus,
    PreviewStatus = ChannelPreviewStatus,
    PreviewTitle = ChannelPreviewTitle,
    PreviewUnreadCount = ChannelPreviewUnreadCount,
    unread,
    mutedStatusPosition,
    lastMessage,
  } = props;

  const {
    theme: {
      channelPreview: { container, contentContainer, row },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <TouchableOpacity
      onPress={() => {
        if (onSelect) {
          onSelect(channel);
        }
      }}
      style={[
        // { opacity: pressed ? 0.5 : 1 },
        styles.container,
        container,
      ]}
      testID='channel-preview-button'
    >
      <PreviewAvatar channel={channel} size='xl' />
      <View
        style={[styles.contentContainer, contentContainer]}
        testID={`channel-preview-content-${channel.id}`}
      >
        <View style={[styles.upperRow, row]}>
          <View style={styles.titleContainer}>
            <PreviewTitle channel={channel} />
            {muted && mutedStatusPosition === 'inlineTitle' ? <PreviewMutedStatus /> : null}
          </View>

          <View style={[styles.statusContainer, row]}>
            <PreviewStatus
              channel={channel}
              formatLatestMessageDate={formatLatestMessageDate}
              lastMessage={lastMessage}
            />
            <PreviewUnreadCount channel={channel} maxUnreadCount={maxUnreadCount} unread={unread} />
          </View>
        </View>

        <View style={[styles.lowerRow, row]}>
          <PreviewMessage channel={channel} lastMessage={lastMessage} />
          {muted && mutedStatusPosition === 'trailingBottom' ? <PreviewMutedStatus /> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export type ChannelPreviewMessengerProps = Partial<
  Omit<ChannelPreviewMessengerPropsWithContext, 'channel'>
> &
  Pick<ChannelPreviewMessengerPropsWithContext, 'channel'>;

const MemoizedChannelPreviewMessengerWithContext = React.memo(
  ChannelPreviewMessengerWithContext,
) as typeof ChannelPreviewMessengerWithContext;

/**
 * This UI component displays an individual preview item for each channel in a list. It also receives all props
 * from the ChannelPreview component.
 */
export const ChannelPreviewMessenger = (props: ChannelPreviewMessengerProps) => {
  const {
    forceUpdate,
    maxUnreadCount,
    onSelect,
    PreviewMessage,
    PreviewMutedStatus,
    PreviewStatus,
    PreviewTitle,
    PreviewUnreadCount,
    mutedStatusPosition,
  } = useChannelsContext();
  return (
    <MemoizedChannelPreviewMessengerWithContext
      {...{
        forceUpdate,
        maxUnreadCount,
        onSelect,
        PreviewMessage,
        PreviewMutedStatus,
        PreviewStatus,
        PreviewTitle,
        PreviewUnreadCount,
        mutedStatusPosition,
      }}
      {...props}
    />
  );
};

ChannelPreviewMessenger.displayName = 'ChannelPreviewMessenger{channelPreview}';

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        borderBottomWidth: 1,
        flexDirection: 'row',
        padding: primitives.spacingMd,
        borderBottomColor: semantics.borderCoreSubtle,
        gap: primitives.spacingMd,
      },
      contentContainer: { flex: 1, gap: primitives.spacingXxs },
      upperRow: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
      lowerRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
      innerRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingXxs,
      },
      statusContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingXs,
      },
      titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: primitives.spacingXxs,
        flexShrink: 1,
      },
    });
  }, [semantics]);
};
