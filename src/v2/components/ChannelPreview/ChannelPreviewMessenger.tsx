import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import truncate from 'lodash/truncate';

import { useChannelPreviewDisplayName } from './hooks/useChannelPreviewDisplayName';
import { useChannelPreviewDisplayAvatar } from './hooks/useChannelPreviewDisplayAvatar';

import { Avatar } from '../Avatar/Avatar';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { ChannelState, MessageResponse } from 'stream-chat';

import type { ChannelPreviewProps } from './ChannelPreview';
import type { LatestMessagePreview } from './hooks/useLatestMessagePreview';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const styles = StyleSheet.create({
  container: {
    borderBottomColor: '#EBEBEB',
    borderBottomWidth: 1,
    flexDirection: 'row',
    padding: 10,
  },
  date: {
    color: '#767676',
    fontSize: 11,
    textAlign: 'right',
  },
  details: {
    flex: 1,
    paddingLeft: 10,
  },
  detailsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  styledMessage: {
    fontSize: 13,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export type ChannelPreviewMessengerProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = ChannelPreviewProps<At, Ch, Co, Ev, Me, Re, Us> & {
  /** Latest message on a channel, formatted for preview */
  latestMessagePreview: LatestMessagePreview<At, Ch, Co, Ev, Me, Re, Us>;
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
  /** Most recent message on the channel */
  lastMessage?:
    | ReturnType<ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messageToImmutable']>
    | MessageResponse<At, Ch, Co, Me, Re, Us>;
  /** Length at which latest message should be truncated */
  latestMessageLength?: number;
  /** Number of unread messages on the channel */
  unread?: number;
};

/**
 * This UI component displays an individual preview item for each channel in a list. It also receives all props
 * from the ChannelPreview component.
 *
 * @example ./ChannelPreviewMessenger.md
 */
export const ChannelPreviewMessenger = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ChannelPreviewMessengerProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    channel,
    formatLatestMessageDate,
    latestMessageLength = 30,
    latestMessagePreview,
    setActiveChannel,
    unread,
  } = props;

  const {
    theme: {
      channelPreview: {
        container,
        date,
        details,
        detailsTop,
        message: {
          color,
          fontWeight,
          unreadColor,
          unreadFontWeight,
          ...message
        },
        title,
      },
    },
  } = useTheme();

  const displayAvatar = useChannelPreviewDisplayAvatar(channel);
  const displayName = useChannelPreviewDisplayName(channel);
  const latestMessageDate = latestMessagePreview?.messageObject?.created_at?.asMutable();

  return (
    <TouchableOpacity
      onPress={() => setActiveChannel?.(channel)}
      style={[styles.container, container]}
      testID='channel-preview-button'
    >
      <Avatar image={displayAvatar.image} name={displayAvatar.name} size={40} />
      <View style={[styles.details, details]}>
        <View style={[styles.detailsTop, detailsTop]}>
          <Text
            ellipsizeMode='tail'
            numberOfLines={1}
            style={[styles.title, title]}
          >
            {displayName}
          </Text>
          <Text style={[styles.date, date]}>
            {formatLatestMessageDate && latestMessageDate
              ? formatLatestMessageDate(latestMessageDate)
              : latestMessagePreview?.created_at}
          </Text>
        </View>
        <Text
          style={[
            styles.styledMessage,
            unread
              ? { color: unreadColor, fontWeight: unreadFontWeight }
              : { color, fontWeight },
            message,
          ]}
        >
          {latestMessagePreview?.text &&
            truncate(latestMessagePreview.text.replace(/\n/g, ' '), {
              length: latestMessageLength,
            })}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

ChannelPreviewMessenger.displayName = 'ChannelPreviewMessenger{channelPreview}';
