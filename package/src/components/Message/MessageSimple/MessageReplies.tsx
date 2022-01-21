import React from 'react';
import { ColorValue, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
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
    marginTop: 8,
  },
  curveContainer: {
    flexDirection: 'row',
  },
  leftMessageRepliesCurve: {
    borderBottomLeftRadius: 16,
    borderRightColor: 'transparent',
    ...Platform.select({
      android: {
        borderRightWidth: 0,
      },
    }),
  },
  messageRepliesCurve: {
    borderTopColor: 'transparent',
    borderTopWidth: 0,
    borderWidth: 1,
    height: 16,
    width: 16,
  },
  messageRepliesText: {
    fontSize: 12,
    fontWeight: '700',
    paddingBottom: 5,
    paddingLeft: 8,
  },
  rightMessageRepliesCurve: {
    borderBottomRightRadius: 16,
    borderLeftColor: 'transparent',
    ...Platform.select({
      android: {
        borderLeftWidth: 0,
      },
    }),
  },
});

export type MessageRepliesPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Pick<
  MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  | 'alignment'
  | 'message'
  | 'onLongPress'
  | 'onPress'
  | 'onPressIn'
  | 'onOpenThread'
  | 'preventPress'
  | 'threadList'
> &
  Pick<MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'MessageRepliesAvatars'> &
  Pick<TranslationContextValue, 't'> & {
    noBorder?: boolean;
    repliesCurveColor?: ColorValue;
  };

const MessageRepliesWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  props: MessageRepliesPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    alignment,
    message,
    MessageRepliesAvatars,
    noBorder,
    onLongPress,
    onOpenThread,
    onPress,
    onPressIn,
    preventPress,
    repliesCurveColor,
    t,
    threadList,
  } = props;

  const {
    theme: {
      colors: { accent_blue },
      messageSimple: {
        replies: { container, leftCurve, messageRepliesText, rightCurve },
      },
    },
  } = useTheme('MessageReplies');

  if (threadList || !message.reply_count) return null;

  return (
    <View style={styles.curveContainer}>
      {alignment === 'left' && (
        <View testID='message-replies-left'>
          {!noBorder && (
            <View
              style={[
                { borderColor: repliesCurveColor },
                styles.messageRepliesCurve,
                styles.leftMessageRepliesCurve,
                leftCurve,
              ]}
            />
          )}
          <MessageRepliesAvatars alignment={alignment} message={message} />
        </View>
      )}
      <TouchableOpacity
        disabled={preventPress}
        onLongPress={(event) => {
          if (onLongPress) {
            onLongPress({
              emitter: 'messageReplies',
              event,
            });
          }
        }}
        onPress={(event) => {
          if (onPress) {
            onPress({
              defaultHandler: onOpenThread,
              emitter: 'messageReplies',
              event,
            });
          }
        }}
        onPressIn={(event) => {
          if (onPressIn) {
            onPressIn({
              defaultHandler: onOpenThread,
              emitter: 'messageReplies',
              event,
            });
          }
        }}
        style={[styles.container, container]}
        testID='message-replies'
      >
        <Text style={[styles.messageRepliesText, { color: accent_blue }, messageRepliesText]}>
          {message.reply_count === 1
            ? t('1 Thread Reply')
            : t('{{ replyCount }} Thread Replies', {
                replyCount: message.reply_count,
              })}
        </Text>
      </TouchableOpacity>
      {alignment === 'right' && (
        <View testID='message-replies-right'>
          <MessageRepliesAvatars alignment={alignment} message={message} />
          {!noBorder && (
            <View
              style={[
                { borderColor: repliesCurveColor },
                styles.messageRepliesCurve,
                styles.rightMessageRepliesCurve,
                rightCurve,
              ]}
            />
          )}
        </View>
      )}
    </View>
  );
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
  prevProps: MessageRepliesPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessageRepliesPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    message: prevMessage,
    noBorder: prevNoBorder,
    onOpenThread: prevOnOpenThread,
    t: prevT,
    threadList: prevThreadList,
  } = prevProps;
  const {
    message: nextMessage,
    noBorder: nextNoBorder,
    onOpenThread: nextOnOpenThread,
    t: nextT,
    threadList: nextThreadList,
  } = nextProps;

  const threadListEqual = prevThreadList === nextThreadList;
  if (!threadListEqual) return false;

  const messageReplyCountEqual = prevMessage.reply_count === nextMessage.reply_count;
  if (!messageReplyCountEqual) return false;

  const noBorderEqual = prevNoBorder === nextNoBorder;
  if (!noBorderEqual) return false;

  const tEqual = prevT === nextT;
  if (!tEqual) return false;

  const onOpenThreadEqual = prevOnOpenThread === nextOnOpenThread;
  if (!onOpenThreadEqual) return false;

  return true;
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
  Us extends UnknownType = DefaultUserType,
> = Partial<MessageRepliesPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

export const MessageReplies = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  props: MessageRepliesProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    alignment,
    message,
    onLongPress,
    onOpenThread,
    onPress,
    onPressIn,
    preventPress,
    threadList,
  } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>('MessageReplies');
  const { MessageRepliesAvatars } =
    useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>('MessageReplies');
  const { t } = useTranslationContext('MessageReplies');

  return (
    <MemoizedMessageReplies
      {...{
        alignment,
        message,
        MessageRepliesAvatars,
        onLongPress,
        onOpenThread,
        onPress,
        onPressIn,
        preventPress,
        t,
        threadList,
      }}
      {...props}
    />
  );
};

MessageReplies.displayName = 'MessageReplies{messageSimple{replies}}';
