import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { RectButton, TouchableOpacity } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';

import { useChannelPreviewDisplayAvatar } from './hooks/useChannelPreviewDisplayAvatar';
import { useChannelPreviewDisplayPresence } from './hooks/useChannelPreviewDisplayPresence';
import { useChannelPreviewDisplayName } from './hooks/useChannelPreviewDisplayName';

import { Avatar } from '../Avatar/Avatar';
import { GroupAvatar } from '../Avatar/GroupAvatar';

import {
  ChannelInfoOverlayContextValue,
  useChannelInfoOverlayContext,
} from '../../contexts/channelInfoOverlayContext/ChannelInfoOverlayContext';
import {
  ChannelsContextValue,
  useChannelsContext,
} from '../../contexts/channelsContext/ChannelsContext';
import {
  ChatContextValue,
  useChatContext,
} from '../../contexts/chatContext/ChatContext';
import {
  OverlayContextValue,
  useOverlayContext,
} from '../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Check } from '../../icons/Check';
import { CheckAll } from '../../icons/CheckAll';
import { Delete } from '../../icons/Delete';
import { MenuPointHorizontal } from '../../icons/MenuPointHorizontal';
import { vw } from '../../utils/utils';

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
  bold: { fontWeight: 'bold' },
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
  leftSwipeableButton: {
    paddingLeft: 20,
    paddingRight: 10,
    paddingVertical: 20,
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
  rightSwipeableButton: {
    paddingLeft: 10,
    paddingRight: 20,
    paddingVertical: 20,
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
  swipeableContainer: {
    alignItems: 'center',
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

const maxWidth = vw(80) - 16 - 40;

export type ChannelPreviewMessengerPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<
  ChannelInfoOverlayContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  'setData'
> &
  Pick<ChannelPreviewProps<At, Ch, Co, Ev, Me, Re, Us>, 'channel'> &
  Pick<ChannelsContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'onSelect'> &
  Pick<ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'client'> &
  Pick<OverlayContextValue, 'setOverlay'> & {
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
    /**
     * This map describes the values to use as inputRange for extra interpolation: AnimatedValue: [startValue, endValue]
     * progressAnimatedValue: [0, 1] dragAnimatedValue: [0, -]
     * To support rtl flexbox layouts use flexDirection styling.
     */
    renderRightActions?:
      | ((
          progressAnimatedValue: Animated.AnimatedInterpolation,
          dragAnimatedValue: Animated.AnimatedInterpolation,
        ) => React.ReactNode)
      | undefined;
    /** Number of unread messages on the channel */
    unread?: number;
  };

const ChannelPreviewMessengerWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ChannelPreviewMessengerPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    channel,
    client,
    formatLatestMessageDate,
    latestMessagePreview,
    onSelect,
    renderRightActions,
    setData,
    setOverlay,
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
        leftSwipeableButton,
        message,
        rightSwipeableButton,
        row,
        swipeableContainer,
        title,
        unreadContainer,
        unreadText,
      },
      colors: { danger },
    },
  } = useTheme();

  const displayAvatar = useChannelPreviewDisplayAvatar(channel);
  const displayName = useChannelPreviewDisplayName(
    channel,
    Math.floor(maxWidth / ((title.fontSize || styles.title.fontSize) / 2)),
  );
  const displayPresence = useChannelPreviewDisplayPresence(channel);
  const created_at = latestMessagePreview.messageObject?.created_at;
  const latestMessageDate = created_at
    ? typeof created_at === 'string'
      ? new Date(created_at)
      : created_at.asMutable()
    : new Date();
  const status = latestMessagePreview.status;

  return (
    <Swipeable
      renderRightActions={(progress, drag) =>
        renderRightActions ? (
          renderRightActions(progress, drag)
        ) : (
          <View style={[styles.swipeableContainer, swipeableContainer]}>
            <RectButton
              onPress={() => {
                setData({ channel, clientId: client.userID });
                setOverlay('channelInfo');
              }}
              style={[styles.leftSwipeableButton, leftSwipeableButton]}
            >
              <MenuPointHorizontal />
            </RectButton>
            <RectButton
              onPress={() => channel.delete()}
              style={[styles.rightSwipeableButton, rightSwipeableButton]}
            >
              <Delete pathFill={danger} />
            </RectButton>
          </View>
        )
      }
    >
      <TouchableOpacity
        onPress={() => {
          if (onSelect) {
            onSelect(channel);
          }
        }}
        style={[styles.container, container]}
        testID='channel-preview-button'
      >
        {displayAvatar.images ? (
          <GroupAvatar
            images={displayAvatar.images}
            names={displayAvatar.names}
            size={40}
          />
        ) : (
          <Avatar
            image={displayAvatar.image}
            name={displayAvatar.name}
            online={displayPresence}
            size={40}
          />
        )}
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
              {latestMessagePreview.previews.map((preview, index) =>
                preview.text ? (
                  <Text
                    key={`${preview.text}_${index}`}
                    style={preview.bold ? styles.bold : {}}
                  >
                    {preview.text}
                  </Text>
                ) : null,
              )}
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
                  : latestMessagePreview.created_at}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

// const areEqual = <
//   At extends UnknownType = DefaultAttachmentType,
//   Ch extends DefaultChannelType = DefaultChannelType,
//   Co extends string = DefaultCommandType,
//   Ev extends UnknownType = DefaultEventType,
//   Me extends UnknownType = DefaultMessageType,
//   Re extends UnknownType = DefaultReactionType,
//   Us extends UnknownType = DefaultUserType
// >(
//   prevProps: ChannelPreviewMessengerPropsWithContext<
//     At,
//     Ch,
//     Co,
//     Ev,
//     Me,
//     Re,
//     Us
//   >,
//   nextProps: ChannelPreviewMessengerPropsWithContext<
//     At,
//     Ch,
//     Co,
//     Ev,
//     Me,
//     Re,
//     Us
//   >,
// ) => {
//   const {
//     channel: prevChannel,
//     latestMessagePreview: prevLatestMessagePreview,
//   } = prevProps;
//   const {
//     channel: nextChannel,
//     latestMessagePreview: nextLatestMessagePreview,
//   } = nextProps;

//   const channelEqual =
//     prevChannel.data?.image === nextChannel.data?.image &&
//     prevChannel.data?.name === nextChannel.data?.name &&
//     Object.keys(prevChannel.state.members).every(
//       (memberId) =>
//         nextChannel.state.members[memberId].user?.online ===
//         prevChannel.state.members[memberId].user?.online,
//     );
//   if (!channelEqual) return false;

//   const latestMessagePreviewEqual =
//     prevLatestMessagePreview.previews
//       .map(({ bold, text }) => `${bold}${text}`)
//       .join() ===
//     nextLatestMessagePreview.previews
//       .map(({ bold, text }) => `${bold}${text}`)
//       .join();
//   if (!latestMessagePreviewEqual) return false;

//   return true;
// };

// const MemoizedChannelPreviewMessenger = React.memo(
//   ChannelPreviewMessengerWithContext,
//   areEqual,
// ) as typeof ChannelPreviewMessengerWithContext;

export type ChannelPreviewMessengerProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<
  Omit<
    ChannelPreviewMessengerPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
    'channel' | 'latestMessagePreview'
  >
> &
  Pick<
    ChannelPreviewMessengerPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
    'channel' | 'latestMessagePreview'
  >;

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
  const { setData } = useChannelInfoOverlayContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { onSelect } = useChannelsContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { setOverlay } = useOverlayContext();

  return (
    <ChannelPreviewMessengerWithContext
      {...{ client, onSelect, setData, setOverlay }}
      {...props}
    />
  );
};

ChannelPreviewMessenger.displayName = 'ChannelPreviewMessenger{channelPreview}';
