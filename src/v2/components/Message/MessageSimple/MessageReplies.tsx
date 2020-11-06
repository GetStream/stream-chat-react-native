import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../../contexts/translationContext/TranslationContext';

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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 5,
  },
  messageRepliesText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export type MessageRepliesPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<
  MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  'message' | 'onOpenThread' | 'threadList'
> &
  Pick<TranslationContextValue, 't'>;

const MessageRepliesWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageRepliesPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { message, onOpenThread, t, threadList } = props;

  const {
    theme: {
      colors: { primary },
      messageSimple: {
        replies: { container, messageRepliesText },
      },
    },
  } = useTheme();
  if (threadList || !message.reply_count) return null;

  return (
    <TouchableOpacity
      onPress={onOpenThread}
      style={[styles.container, container]}
      testID='message-replies'
    >
      <Text
        style={[
          styles.messageRepliesText,
          { color: primary },
          messageRepliesText,
        ]}
      >
        {message.reply_count === 1
          ? t('1 Thread Reply')
          : t('{{ replyCount }} Thread Replies', {
              replyCount: message.reply_count,
            })}
      </Text>
    </TouchableOpacity>
  );
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: MessageRepliesPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessageRepliesPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { message: prevMessage, threadList: prevThreadList } = prevProps;
  const { message: nextMessage, threadList: nextThreadList } = nextProps;

  const messageReplyCountEqual =
    prevMessage.reply_count === nextMessage.reply_count;
  const threadListEqual = prevThreadList === nextThreadList;

  return messageReplyCountEqual && threadListEqual;
};

const MemoizedMessageReplies = React.memo(
  MessageRepliesWithContext,
  areEqual,
) as typeof MessageRepliesWithContext;

export type MessageRepliesProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<MessageRepliesPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

export const MessageReplies = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageRepliesProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { message, onOpenThread, threadList } = useMessageContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { t } = useTranslationContext();

  return (
    <MemoizedMessageReplies
      {...{ message, onOpenThread, t, threadList }}
      {...props}
    />
  );
};

MessageReplies.displayName = 'MessageReplies{messageSimple{replies}}';
