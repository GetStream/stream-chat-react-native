import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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

export type MessageStatusPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageContextValue<StreamChatGenerics>, 'message' | 'threadList'>;

const MessageStatusWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageStatusPropsWithContext<StreamChatGenerics>,
) => {
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

  if (isMessageWithStylesReadByAndDateSeparator(message) && !threadList) {
    return (
      <View style={[styles.statusContainer, statusContainer]}>
        {typeof message.readBy === 'number' ? (
          <Text
            style={[styles.readByCount, { color: accent_blue }, readByCount]}
            testID='read-by-container'
          >
            {message.readBy}
          </Text>
        ) : null}
        {typeof message.readBy === 'number' || message.readBy === true ? (
          <CheckAll pathFill={accent_blue} {...checkAllIcon} />
        ) : (
          <Check pathFill={grey_dark} {...checkIcon} />
        )}
      </View>
    );
  }

  if (
    message.status === MessageStatusTypes.RECEIVED &&
    message.type !== 'ephemeral' &&
    !threadList
  ) {
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
  if (!threadListEqual) return false;

  const messageEqual =
    prevMessage.status === nextMessage.status &&
    prevMessage.type === nextMessage.type &&
    (isMessageWithStylesReadByAndDateSeparator(prevMessage) && prevMessage.readBy) ===
      (isMessageWithStylesReadByAndDateSeparator(nextMessage) && nextMessage.readBy);
  if (!messageEqual) return false;

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
