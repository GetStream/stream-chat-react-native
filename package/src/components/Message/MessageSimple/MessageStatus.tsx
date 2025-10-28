import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Check } from '../../../icons/Check';
import { CheckAll } from '../../../icons/CheckAll';
import { Time } from '../../../icons/Time';
import { MessageStatusTypes } from '../../../utils/utils';

export type MessageStatusPropsWithContext = Pick<
  MessageContextValue,
  'deliveredToCount' | 'message' | 'readBy' | 'threadList'
> & {
  channelMembersCount: number;
};

const MessageStatusWithContext = (props: MessageStatusPropsWithContext) => {
  const { channelMembersCount, deliveredToCount, message, readBy, threadList } = props;

  const {
    theme: {
      colors: { accent_blue, grey_dark },
      messageSimple: {
        status: { checkAllIcon, checkIcon, readByCount, statusContainer, timeIcon },
      },
    },
  } = useTheme();

  if (threadList || message.status === MessageStatusTypes.FAILED || message.type === 'error') {
    return null;
  }

  const hasReadByGreaterThanOne = typeof readBy === 'number' && readBy > 1;

  // Variables to determine the status of the message
  const read = hasReadByGreaterThanOne || readBy === true;
  const delivered = deliveredToCount > 1;
  const sending = message.status === MessageStatusTypes.SENDING;
  const sent =
    message.status === MessageStatusTypes.RECEIVED &&
    !delivered &&
    !read &&
    message.type !== 'ephemeral';

  const isGroupChannel = channelMembersCount > 2;

  const shouldDisplayReadByCount = isGroupChannel && hasReadByGreaterThanOne;
  const countOfReadBy = typeof readBy === 'number' && shouldDisplayReadByCount ? readBy - 1 : 0;

  return (
    <View style={[styles.statusContainer, statusContainer]}>
      {shouldDisplayReadByCount ? (
        <Text
          accessibilityLabel='Read by count'
          style={[styles.readByCount, { color: accent_blue }, readByCount]}
        >
          {countOfReadBy}
        </Text>
      ) : null}
      {read ? (
        <CheckAll pathFill={accent_blue} {...checkAllIcon} accessibilityLabel='Read' />
      ) : delivered ? (
        <CheckAll pathFill={grey_dark} {...checkAllIcon} accessibilityLabel='Delivered' />
      ) : sending ? (
        <Time pathFill={grey_dark} {...timeIcon} accessibilityLabel='Sending' />
      ) : sent ? (
        <Check pathFill={grey_dark} {...checkIcon} accessibilityLabel='Sent' />
      ) : null}
    </View>
  );
};

const areEqual = (
  prevProps: MessageStatusPropsWithContext,
  nextProps: MessageStatusPropsWithContext,
) => {
  const {
    deliveredToCount: prevDeliveredBy,
    message: prevMessage,
    readBy: prevReadBy,
    threadList: prevThreadList,
    channelMembersCount: prevChannelMembersCount,
  } = prevProps;
  const {
    deliveredToCount: nextDeliveredBy,
    message: nextMessage,
    readBy: nextReadBy,
    threadList: nextThreadList,
    channelMembersCount: nextChannelMembersCount,
  } = nextProps;

  const deliveredByEqual = prevDeliveredBy === nextDeliveredBy;
  if (!deliveredByEqual) {
    return false;
  }

  const threadListEqual = prevThreadList === nextThreadList;
  if (!threadListEqual) {
    return false;
  }

  const readByEqual = prevReadBy === nextReadBy;
  if (!readByEqual) {
    return false;
  }

  const channelMembersCountEqual = prevChannelMembersCount === nextChannelMembersCount;
  if (!channelMembersCountEqual) {
    return false;
  }

  const messageEqual =
    prevMessage.status === nextMessage.status && prevMessage.type === nextMessage.type;
  if (!messageEqual) {
    return false;
  }

  return true;
};

const MemoizedMessageStatus = React.memo(
  MessageStatusWithContext,
  areEqual,
) as typeof MessageStatusWithContext;

export type MessageStatusProps = Partial<MessageStatusPropsWithContext> & {
  channelMembersCount: number;
};

export const MessageStatus = (props: MessageStatusProps) => {
  const { channel } = useChannelContext();
  const { deliveredToCount, message, readBy, threadList } = useMessageContext();

  const channelMembersCount = channel?.state.members?.length;

  return (
    <MemoizedMessageStatus
      {...{ channel, channelMembersCount, deliveredToCount, message, readBy, threadList }}
      {...props}
    />
  );
};

MessageStatus.displayName = 'MessageStatus{messageSimple{status}}';

const styles = StyleSheet.create({
  readByCount: {
    fontSize: 11,
    fontWeight: '700',
    paddingRight: 3,
  },
  statusContainer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingRight: 3,
  },
});
