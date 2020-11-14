import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RectButton, TouchableOpacity } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Svg, { Circle } from 'react-native-svg';

import { useChannelPreviewDisplayAvatar } from './hooks/useChannelPreviewDisplayAvatar';
import { useChannelPreviewDisplayPresence } from './hooks/useChannelPreviewDisplayPresence';
import { useChannelPreviewDisplayName } from './hooks/useChannelPreviewDisplayName';

import { Avatar } from '../Avatar/Avatar';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Check } from '../../icons/Check';
import { CheckAll } from '../../icons/CheckAll';
import { Delete } from '../../icons/Delete';
import { MenuPointHorizontal } from '../../icons/MenuPointHorizontal';

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
    borderBottomWidth: 1,
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  contentContainer: { flexGrow: 1, flexShrink: 1 },
  date: {
    fontSize: 12,
    textAlign: 'right',
  },
  flexRow: {
    flexDirection: 'row',
  },
  message: {
    flexShrink: 1,
    fontSize: 12.5,
  },
  presenceIndicatorContainer: {
    height: 12,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 12,
  },
  row: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  skeletonContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  title: { fontSize: 14, fontWeight: '700' },
  unreadContainer: {
    alignItems: 'center',
    borderRadius: 8,
    flexShrink: 1,
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 5,
    paddingVertical: 1,
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
    latestMessagePreview,
    setActiveChannel,
    unread,
  } = props;

  const {
    theme: {
      channelPreview: {
        checkAllIcon,
        checkIcon,
        container,
        contentContainer,
        date,
        message,
        presenceIndicator,
        presenceIndicatorContainer,
        row,
        title,
        unreadContainer,
        unreadText,
      },
    },
  } = useTheme();

  const displayAvatar = useChannelPreviewDisplayAvatar(channel);
  const displayName = useChannelPreviewDisplayName(channel);
  const displayPresence = useChannelPreviewDisplayPresence(channel);
  const latestMessageDate = latestMessagePreview?.messageObject?.created_at?.asMutable();
  const status = latestMessagePreview.status;

  return (
    <Swipeable
      renderRightActions={(progress, dragX) => (
        <View
          style={{
            alignItems: 'center',
            backgroundColor: '#F5F5F5',
            flexDirection: 'row',
            padding: 20,
          }}
        >
          <RectButton style={{ paddingRight: 20 }}>
            <MenuPointHorizontal />
          </RectButton>
          <RectButton>
            <Delete />
          </RectButton>
        </View>
      )}
    >
      <TouchableOpacity
        onPress={() => {
          if (setActiveChannel) {
            setActiveChannel(channel);
          }
        }}
        style={[styles.container, container]}
        testID='channel-preview-button'
      >
        <View>
          <Avatar
            image={displayAvatar.image}
            name={displayAvatar.name}
            size={40}
          />
          {displayPresence && (
            <View
              style={[
                styles.presenceIndicatorContainer,
                presenceIndicatorContainer,
              ]}
            >
              <Svg>
                <Circle {...presenceIndicator} />
              </Svg>
            </View>
          )}
        </View>
        <View style={[styles.contentContainer, contentContainer]}>
          <View style={[styles.row, row]}>
            <Text numberOfLines={1} style={[styles.title, title]}>
              {displayName}
            </Text>
            <View style={[styles.unreadContainer, unreadContainer]}>
              {!!unread && (
                <Text numberOfLines={1} style={[styles.unreadText, unreadText]}>
                  {unread}
                </Text>
              )}
            </View>
          </View>
          <View style={[styles.row, row]}>
            <Text numberOfLines={1} style={[styles.message, message]}>
              {latestMessagePreview?.text &&
                latestMessagePreview.text.replace(/\n/g, ' ')}
            </Text>
            <View style={styles.flexRow}>
              {status === 2 ? (
                <CheckAll {...checkAllIcon} />
              ) : status === 1 ? (
                <Check {...checkIcon} />
              ) : null}
              <Text style={[styles.date, date]}>
                {formatLatestMessageDate && latestMessageDate
                  ? formatLatestMessageDate(latestMessageDate)
                  : latestMessagePreview?.created_at}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

ChannelPreviewMessenger.displayName = 'ChannelPreviewMessenger{channelPreview}';
