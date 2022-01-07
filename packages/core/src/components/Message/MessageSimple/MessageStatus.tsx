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

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';
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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType,
> = Pick<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'message' | 'threadList'>;

const MessageStatusWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType,
>(
  props: MessageStatusPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
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

  if (message.status === 'sending') {
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

  if (message.status === 'received' && message.type !== 'ephemeral' && !threadList) {
    return (
      <View style={[styles.statusContainer, statusContainer]} testID='delivered-container'>
        <Check pathFill={grey_dark} {...checkIcon} />
      </View>
    );
  }

  return null;
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  prevProps: MessageStatusPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessageStatusPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType,
> = Partial<MessageStatusPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

export const MessageStatus = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType,
>(
  props: MessageStatusProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { message, threadList } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();

  return <MemoizedMessageStatus {...{ message, threadList }} {...props} />;
};

MessageStatus.displayName = 'MessageStatus{messageSimple{status}}';
