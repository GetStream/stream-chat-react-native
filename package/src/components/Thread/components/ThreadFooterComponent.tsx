import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

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
import { primitives } from '../../../theme';

type ThreadFooterComponentPropsWithContext = Pick<MessagesContextValue, 'Message'> &
  Pick<ThreadContextValue, 'parentMessagePreventPress' | 'thread' | 'threadInstance'>;

export const InlineLoadingMoreThreadIndicator = () => {
  const { threadLoadingMore } = useThreadContext();
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();

  if (!threadLoadingMore) {
    return null;
  }

  return (
    <View style={styles.activityIndicatorContainer}>
      <ActivityIndicator color={semantics.accentPrimary} size='small' />
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

  const styles = useStyles();

  const { replyCount = thread?.reply_count } = useStateStore(threadInstance?.state, selector) ?? {};

  if (!thread) {
    return null;
  }

  return (
    <View style={styles.threadHeaderContainer} testID='thread-footer-component'>
      <Message
        groupStyles={['single']}
        message={thread}
        preventPress={parentMessagePreventPress}
        readBy={0}
        threadList
      />
      <View style={styles.newThread}>
        <Text style={styles.text}>
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

const useStyles = () => {
  const {
    theme: {
      semantics,
      thread: {
        newThread: { container, text },
      },
    },
  } = useTheme();

  return useMemo(() => {
    return StyleSheet.create({
      activityIndicatorContainer: {
        padding: primitives.spacingXs,
        width: '100%',
      },
      newThread: {
        backgroundColor: semantics.backgroundCoreSurfaceSubtle,
        paddingVertical: primitives.spacingXs,
        alignItems: 'center',
        justifyContent: 'center',
        borderTopWidth: 1,
        borderTopColor: semantics.borderCoreSubtle,
        borderBottomWidth: 1,
        borderBottomColor: semantics.borderCoreSubtle,
        marginVertical: primitives.spacingXs,
        ...container,
      },
      text: {
        color: semantics.chatTextSystem,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
        ...text,
      },
      threadHeaderContainer: {},
    });
  }, [semantics, container, text]);
};
