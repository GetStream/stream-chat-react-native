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
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { vw } from '../../../utils/utils';

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
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessagesContextValue<StreamChatClient>, 'Message'> &
  Pick<ThreadContextValue<StreamChatClient>, 'thread'>;

const ThreadFooterComponentWithContext = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ThreadFooterComponentPropsWithContext<StreamChatClient>,
) => {
  const { Message, thread } = props;
  const { t } = useTranslationContext();

  const {
    theme: {
      colors: { bg_gradient_end, bg_gradient_start, grey },
      thread: {
        newThread: { backgroundGradientStart, backgroundGradientStop, text, ...newThread },
      },
    },
  } = useTheme();

  if (!thread) return null;

  const replyCount = thread.reply_count;

  return (
    <View style={styles.threadHeaderContainer} testID='thread-footer-component'>
      <View style={styles.messagePadding}>
        <Message groupStyles={['single']} message={thread} preventPress threadList />
      </View>
      <View style={[styles.newThread, newThread]}>
        <Svg height={newThread.height ?? 24} style={styles.absolute} width={vw(100)}>
          <Rect fill='url(#gradient)' height={newThread.height ?? 24} width={vw(100)} x={0} y={0} />
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

const areEqual = <StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: ThreadFooterComponentPropsWithContext<StreamChatClient>,
  nextProps: ThreadFooterComponentPropsWithContext<StreamChatClient>,
) => {
  const { thread: prevThread } = prevProps;
  const { thread: nextThread } = nextProps;

  const threadEqual =
    prevThread?.id === nextThread?.id &&
    prevThread?.text === nextThread?.text &&
    prevThread?.reply_count === nextThread?.reply_count;
  if (!threadEqual) return false;

  const latestReactionsEqual =
    prevThread &&
    nextThread &&
    Array.isArray(prevThread.latest_reactions) &&
    Array.isArray(nextThread.latest_reactions)
      ? prevThread.latest_reactions.length === nextThread.latest_reactions.length &&
        prevThread.latest_reactions.every(
          ({ type }, index) => type === nextThread.latest_reactions?.[index].type,
        )
      : prevThread?.latest_reactions === nextThread?.latest_reactions;
  if (!latestReactionsEqual) return false;

  return true;
};

const MemoizedThreadFooter = React.memo(
  ThreadFooterComponentWithContext,
  areEqual,
) as typeof ThreadFooterComponentWithContext;

export const ThreadFooterComponent = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  const { Message } = useMessagesContext<StreamChatClient>();
  const { thread } = useThreadContext<StreamChatClient>();

  return (
    <MemoizedThreadFooter
      {...{
        Message,
        thread,
      }}
    />
  );
};
