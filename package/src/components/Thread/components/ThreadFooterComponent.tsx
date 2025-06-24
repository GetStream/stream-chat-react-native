import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { ThreadState } from 'stream-chat';

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
import { useStateStore } from '../../../hooks';
import { useViewport } from '../../../hooks/useViewport';

const styles = StyleSheet.create({
  absolute: { position: 'absolute' },
  activityIndicatorContainer: {
    padding: 10,
    width: '100%',
  },
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

type ThreadFooterComponentPropsWithContext = Pick<MessagesContextValue, 'Message'> &
  Pick<ThreadContextValue, 'parentMessagePreventPress' | 'thread' | 'threadInstance'>;

export const InlineLoadingMoreThreadIndicator = () => {
  const { threadLoadingMore } = useThreadContext();
  const {
    theme: {
      colors: { accent_blue },
    },
  } = useTheme();

  if (!threadLoadingMore) {
    return null;
  }

  return (
    <View style={styles.activityIndicatorContainer}>
      <ActivityIndicator color={accent_blue} size='small' />
    </View>
  );
};

const selector = (nextValue: ThreadState) =>
  ({
    replyCount: nextValue.replyCount,
  }) as const;

const ThreadFooterComponentWithContext = (props: ThreadFooterComponentPropsWithContext) => {
  const { Message, parentMessagePreventPress, thread, threadInstance } = props;
  const { t } = useTranslationContext();
  const { vw } = useViewport();

  const {
    theme: {
      colors: { bg_gradient_end, bg_gradient_start, grey },
      thread: {
        newThread: {
          backgroundGradientStart,
          backgroundGradientStop,
          text,
          threadHeight,
          ...newThread
        },
      },
    },
  } = useTheme();

  const { replyCount = thread?.reply_count } = useStateStore(threadInstance?.state, selector) ?? {};

  if (!thread) {
    return null;
  }

  return (
    <View style={styles.threadHeaderContainer} testID='thread-footer-component'>
      <View style={styles.messagePadding}>
        <Message
          groupStyles={['single']}
          message={thread}
          preventPress={parentMessagePreventPress}
          readBy={0}
          threadList
        />
      </View>
      <View style={[styles.newThread, newThread]}>
        <Svg height={threadHeight ?? 24} style={styles.absolute} width={vw(100)}>
          <Rect fill='url(#gradient)' height={threadHeight ?? 24} width={vw(100)} x={0} y={0} />
          <Defs>
            <LinearGradient
              gradientUnits='userSpaceOnUse'
              id='gradient'
              x1={0}
              x2={0}
              y1={0}
              y2={threadHeight ?? 24}
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
      <InlineLoadingMoreThreadIndicator />
    </View>
  );
};

const areEqual = (
  prevProps: ThreadFooterComponentPropsWithContext,
  nextProps: ThreadFooterComponentPropsWithContext,
) => {
  const {
    parentMessagePreventPress: prevParentMessagePreventPress,
    thread: prevThread,
    threadInstance: prevThreadInstance,
  } = prevProps;
  const {
    parentMessagePreventPress: nextParentMessagePreventPress,
    thread: nextThread,
    threadInstance: nextThreadInstance,
  } = nextProps;

  if (prevParentMessagePreventPress !== nextParentMessagePreventPress) {
    return false;
  }

  const threadEqual =
    prevThread?.id === nextThread?.id &&
    prevThread?.text === nextThread?.text &&
    prevThread?.reply_count === nextThread?.reply_count;

  if (!threadEqual) {
    return false;
  }

  if (prevThreadInstance !== nextThreadInstance) {
    return false;
  }

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
  if (!latestReactionsEqual) {
    return false;
  }

  return true;
};

const MemoizedThreadFooter = React.memo(
  ThreadFooterComponentWithContext,
  areEqual,
) as typeof ThreadFooterComponentWithContext;

export type ThreadFooterComponentProps = Partial<Pick<MessagesContextValue, 'Message'>> &
  Partial<Pick<ThreadContextValue, 'parentMessagePreventPress' | 'thread'>>;

export const ThreadFooterComponent = (props: ThreadFooterComponentProps) => {
  const { Message } = useMessagesContext();
  const { parentMessagePreventPress, thread, threadInstance, threadLoadingMore } =
    useThreadContext();

  return (
    <MemoizedThreadFooter
      {...{
        Message,
        parentMessagePreventPress,
        thread,
        threadInstance,
        threadLoadingMore,
      }}
      {...props}
    />
  );
};
