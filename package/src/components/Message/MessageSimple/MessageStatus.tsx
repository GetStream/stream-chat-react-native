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
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { MessageStatusTypes } from '../../../utils/utils';

import { isMessageWithStylesReadByAndDateSeparator } from '../../MessageList/hooks/useMessageList';

export type MessageStatusPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageContextValue<StreamChatGenerics>, 'message' | 'threadList'>;

const MessageStatusWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageStatusPropsWithContext<StreamChatGenerics>,
) => {
  const { channel } = useChannelContext<StreamChatGenerics>();
  const { message, threadList } = props;

  const {
    theme: {
      colors: { accent_blue, grey_dark },
      messageSimple: {
        status: { checkAllIcon, checkIcon, readByCount, statusContainer, timeIcon },
      },
    },
  } = useTheme();

  if (message.status === MessageStatusTypes.SENDING) {
    return (
      <View style={[styles.statusContainer, statusContainer]} testID='sending-container'>
        <Time {...timeIcon} />
      </View>
    );
  }

  if (threadList || message.status === MessageStatusTypes.FAILED) {
    return null;
  }

  if (isMessageWithStylesReadByAndDateSeparator(message)) {
    const members = channel?.state.members;
    const otherMembers = Object.values(members).filter(
      (member) => member.user_id !== message.user?.id,
    );
    const hasOtherMembersGreaterThanOne = otherMembers.length > 1;
    const hasReadByGreaterThanOne = typeof message.readBy === 'number' && message.readBy > 1;
    const shouldDisplayReadByCount = hasOtherMembersGreaterThanOne && hasReadByGreaterThanOne;
    const countOfReadBy =
      typeof message.readBy === 'number' && hasOtherMembersGreaterThanOne ? message.readBy - 1 : 0;
    const showDoubleCheck = hasReadByGreaterThanOne || message.readBy === true;

    return (
      <View style={[styles.statusContainer, statusContainer]}>
        {shouldDisplayReadByCount ? (
          <Text
            style={[styles.readByCount, { color: accent_blue }, readByCount]}
            testID='read-by-container'
          >
            {countOfReadBy}
          </Text>
        ) : null}
        {message.type !== 'error' ? (
          showDoubleCheck ? (
            <CheckAll pathFill={accent_blue} {...checkAllIcon} />
          ) : (
            <Check pathFill={grey_dark} {...checkIcon} />
          )
        ) : null}
      </View>
    );
  }

  if (message.status === MessageStatusTypes.RECEIVED && message.type !== 'ephemeral') {
    return (
      <View style={[styles.statusContainer, statusContainer]} testID='delivered-container'>
        <Check pathFill={grey_dark} {...checkIcon} />
      </View>
    );
  }

  return null;
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MessageStatusPropsWithContext<StreamChatGenerics>,
  nextProps: MessageStatusPropsWithContext<StreamChatGenerics>,
) => {
  const { message: prevMessage, threadList: prevThreadList } = prevProps;
  const { message: nextMessage, threadList: nextThreadList } = nextProps;

  const threadListEqual = prevThreadList === nextThreadList;
  if (!threadListEqual) {
    return false;
  }

  const messageEqual =
    prevMessage.status === nextMessage.status &&
    prevMessage.type === nextMessage.type &&
    (isMessageWithStylesReadByAndDateSeparator(prevMessage) && prevMessage.readBy) ===
      (isMessageWithStylesReadByAndDateSeparator(nextMessage) && nextMessage.readBy);
  if (!messageEqual) {
    return false;
  }

  return true;
};

const MemoizedMessageStatus = React.memo(
  MessageStatusWithContext,
  areEqual,
) as typeof MessageStatusWithContext;

export type MessageStatusProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<MessageStatusPropsWithContext<StreamChatGenerics>>;

export const MessageStatus = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageStatusProps<StreamChatGenerics>,
) => {
  const { message, threadList } = useMessageContext<StreamChatGenerics>();

  return <MemoizedMessageStatus {...{ message, threadList }} {...props} />;
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
