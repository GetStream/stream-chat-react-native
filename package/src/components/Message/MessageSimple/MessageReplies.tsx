import React from 'react';
import { ColorValue, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    borderRightWidth: 0,
  },
  messageRepliesCurve: {
    borderTopWidth: 0,
    borderWidth: 2,
    height: 16,
    width: 16,
  },
  messageRepliesText: {
    fontSize: 12,
    fontWeight: '700',
    paddingBottom: 5,
    paddingHorizontal: 8,
  },
  rightMessageRepliesCurve: {
    borderBottomRightRadius: 16,
    borderLeftWidth: 0,
  },
});

export type MessageRepliesPropsWithContext = Pick<
  MessageContextValue,
  | 'alignment'
  | 'message'
  | 'onLongPress'
  | 'onPress'
  | 'onPressIn'
  | 'onOpenThread'
  | 'preventPress'
  | 'threadList'
> &
  Pick<MessagesContextValue, 'MessageRepliesAvatars'> &
  Pick<TranslationContextValue, 't'> & {
    noBorder?: boolean;
    repliesCurveColor?: ColorValue;
  };

const MessageRepliesWithContext = (props: MessageRepliesPropsWithContext) => {
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
  } = useTheme();

  if (threadList || !message.reply_count) {
    return null;
  }

  return (
    <View style={styles.curveContainer}>
      {alignment === 'left' && (
        <View style={styles.curveContainer} testID='message-replies-left'>
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
        <View style={styles.curveContainer} testID='message-replies-right'>
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

const areEqual = (
  prevProps: MessageRepliesPropsWithContext,
  nextProps: MessageRepliesPropsWithContext,
) => {
  const {
    message: prevMessage,
    noBorder: prevNoBorder,
    onOpenThread: prevOnOpenThread,
    repliesCurveColor: prevRepliesCurveColor,
    t: prevT,
    threadList: prevThreadList,
  } = prevProps;
  const {
    message: nextMessage,
    noBorder: nextNoBorder,
    onOpenThread: nextOnOpenThread,
    repliesCurveColor: nextRepliesCurveColor,
    t: nextT,
    threadList: nextThreadList,
  } = nextProps;

  const threadListEqual = prevThreadList === nextThreadList;
  if (!threadListEqual) {
    return false;
  }

  const messageReplyCountEqual = prevMessage.reply_count === nextMessage.reply_count;
  if (!messageReplyCountEqual) {
    return false;
  }

  const noBorderEqual = prevNoBorder === nextNoBorder;
  if (!noBorderEqual) {
    return false;
  }

  const repliesCurveColorEqual = prevRepliesCurveColor === nextRepliesCurveColor;
  if (!repliesCurveColorEqual) {
    return false;
  }

  const tEqual = prevT === nextT;
  if (!tEqual) {
    return false;
  }

  const onOpenThreadEqual = prevOnOpenThread === nextOnOpenThread;
  if (!onOpenThreadEqual) {
    return false;
  }

  return true;
};

const MemoizedMessageReplies = React.memo(
  MessageRepliesWithContext,
  areEqual,
) as typeof MessageRepliesWithContext;

export type MessageRepliesProps = Partial<MessageRepliesPropsWithContext>;

export const MessageReplies = (props: MessageRepliesProps) => {
  const {
    alignment,
    message,
    onLongPress,
    onOpenThread,
    onPress,
    onPressIn,
    preventPress,
    threadList,
  } = useMessageContext();
  const { MessageRepliesAvatars } = useMessagesContext();
  const { t } = useTranslationContext();

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
