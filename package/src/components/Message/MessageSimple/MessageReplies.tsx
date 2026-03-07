import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
import { ReplyConnectorLeft } from '../../../icons/ReplyConnectorLeft';
import { ReplyConnectorRight } from '../../../icons/ReplyConnectorRight';
import { primitives } from '../../../theme';
import { useShouldUseOverlayStyles } from '../hooks/useShouldUseOverlayStyles';

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
  Pick<TranslationContextValue, 't'>;

const MessageRepliesWithContext = (props: MessageRepliesPropsWithContext) => {
  const {
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
  } = props;

  const {
    theme: {
      messageSimple: {
        replies: { container, messageRepliesText, content },
      },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();

  if (threadList || !message.reply_count) {
    return null;
  }

  return (
    <View style={[styles.container, container]}>
      {alignment === 'left' && (
        <ReplyConnectorLeft height={48} width={16} stroke={semantics.chatThreadConnectorIncoming} />
      )}
      <Pressable
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
        style={[
          styles.content,
          { flexDirection: alignment === 'left' ? 'row' : 'row-reverse' },
          content,
        ]}
        testID='message-replies'
      >
        <MessageRepliesAvatars />
        <Text style={[styles.messageRepliesText, messageRepliesText]}>
          {message.reply_count === 1
            ? t('1 Reply')
            : t('{{ replyCount }} Replies', {
                replyCount: message.reply_count,
              })}
        </Text>
      </Pressable>
      {alignment === 'right' && (
        <ReplyConnectorRight
          height={48}
          width={16}
          stroke={semantics.chatThreadConnectorOutgoing}
        />
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
    onOpenThread: prevOnOpenThread,
    t: prevT,
    threadList: prevThreadList,
  } = prevProps;
  const {
    message: nextMessage,
    onOpenThread: nextOnOpenThread,
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

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const shouldUseOverlayStyles = useShouldUseOverlayStyles();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: primitives.spacingXs,
        marginTop: -primitives.spacingMd, // Pulling the replies container up to hide the stick in the message content
      },
      content: {
        alignSelf: 'flex-end',
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingXs,
      },
      messageRepliesText: {
        color: shouldUseOverlayStyles ? semantics.textOnAccent : semantics.textPrimary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
      },
    });
  }, [shouldUseOverlayStyles, semantics]);
};
