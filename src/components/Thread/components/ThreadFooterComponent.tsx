import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import {
  ThreadContextValue,
  useThreadContext,
} from '../../../contexts/threadContext/ThreadContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { vw } from '../../../utils/utils';

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
  absolute: { position: 'absolute' },
  messagePadding: {
    paddingHorizontal: 8,
  },
  newThread: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    marginTop: 8,
  },
  text: {
    fontSize: 12,
    textAlign: 'center',
  },
  threadHeaderContainer: {
    marginVertical: 8,
  },
});

type ThreadFooterComponentPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'Message'> &
  Pick<ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'thread'>;

const ThreadFooterComponentWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ThreadFooterComponentPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { Message, thread } = props;
  const { t } = useTranslationContext();

  const {
    theme: {
      colors: { bg_gradient_end, bg_gradient_start, grey },
      thread: {
        newThread: {
          backgroundGradientStart,
          backgroundGradientStop,
          text,
          ...newThread
        },
      },
    },
  } = useTheme();

  if (!thread) return null;

  const replyCount = thread.reply_count;

  return (
    <View style={styles.threadHeaderContainer}>
      <View style={styles.messagePadding}>
        <Message
          groupStyles={['single']}
          message={thread}
          preventPress
          threadList
        />
      </View>
      <View style={[styles.newThread, newThread]}>
        <Svg
          height={newThread.height ?? 24}
          style={styles.absolute}
          width={vw(100)}
        >
          <Rect
            fill='url(#gradient)'
            height={newThread.height ?? 24}
            width={vw(100)}
            x={0}
            y={0}
          />
          <Defs>
            <LinearGradient
              gradientUnits='userSpaceOnUse'
              id='gradient'
              x1={0}
              x2={0}
              y1={0}
              y2={newThread.height ?? 24}
            >
              <Stop
                offset={1}
                stopColor={backgroundGradientStart || bg_gradient_end}
                stopOpacity={1}
              />
              <Stop
                offset={0}
                stopColor={backgroundGradientStop || bg_gradient_start}
                stopOpacity={1}
              />
            </LinearGradient>
          </Defs>
        </Svg>
        <Text style={[styles.text, { color: grey }, text]}>
          {replyCount === 1
            ? t('1 Reply')
            : t('{{ replyCount }} Replies', {
                replyCount,
              })}
        </Text>
      </View>
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
  Us extends UnknownType = DefaultUserType
>(
  prevProps: ThreadFooterComponentPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: ThreadFooterComponentPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { thread: prevThread } = prevProps;
  const { thread: nextThread } = nextProps;

  const threadEqual =
    prevThread?.id === nextThread?.id &&
    prevThread?.text === nextThread?.text &&
    prevThread?.reply_count === nextThread?.reply_count;
  if (!threadEqual) return false;

  return true;
};

const MemoizedThreadFooter = React.memo(
  ThreadFooterComponentWithContext,
  areEqual,
) as typeof ThreadFooterComponentWithContext;

export const ThreadFooterComponent = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>() => {
  const { Message } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { thread } = useThreadContext<At, Ch, Co, Ev, Me, Re, Us>();

  return (
    <MemoizedThreadFooter
      {...{
        Message,
        thread,
      }}
    />
  );
};
