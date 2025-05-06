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
  'message' | 'readBy' | 'threadList'
>;

const MessageStatusWithContext = (props: MessageStatusPropsWithContext) => {
  const { channel } = useChannelContext();
  const { message, readBy, threadList } = props;

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

  if (readBy) {
    const members = channel?.state.members;
    const otherMembers = Object.values(members).filter(
      (member) => member.user_id !== message.user?.id,
    );
    const hasOtherMembersGreaterThanOne = otherMembers.length > 1;
    const hasReadByGreaterThanOne = typeof readBy === 'number' && readBy > 1;
    const shouldDisplayReadByCount = hasOtherMembersGreaterThanOne && hasReadByGreaterThanOne;
    const countOfReadBy =
      typeof readBy === 'number' && hasOtherMembersGreaterThanOne ? readBy - 1 : 0;
    const showDoubleCheck = hasReadByGreaterThanOne || readBy === true;

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

const areEqual = (
  prevProps: MessageStatusPropsWithContext,
  nextProps: MessageStatusPropsWithContext,
) => {
  const { message: prevMessage, readBy: prevReadBy, threadList: prevThreadList } = prevProps;
  const { message: nextMessage, readBy: nextReadBy, threadList: nextThreadList } = nextProps;

  const threadListEqual = prevThreadList === nextThreadList;
  if (!threadListEqual) {
    return false;
  }

  const readByEqual = prevReadBy === nextReadBy;
  if (!readByEqual) {
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

export type MessageStatusProps = Partial<MessageStatusPropsWithContext>;

export const MessageStatus = (props: MessageStatusProps) => {
  const { message, readBy, threadList } = useMessageContext();

  return <MemoizedMessageStatus {...{ message, readBy, threadList }} {...props} />;
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
