import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import type { ThreadState } from 'stream-chat';

import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import {
  ThreadContextValue,
  useThreadContext,
} from '../../../contexts/threadContext/ThreadContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../../hooks';
import { primitives } from '../../../theme';

type ThreadFooterComponentPropsWithContext = Pick<
  ThreadContextValue,
  'parentMessagePreventPress' | 'threadInstance'
>;

const loadingSelector = (state: { isLoading: boolean }) => ({ isLoading: state.isLoading });

export const InlineLoadingMoreThreadIndicator = () => {
  const { threadInstance } = useThreadContext();
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();
  const { isLoading } =
    useStateStore(threadInstance?.messagePaginator?.state, loadingSelector) ?? {};

  if (!isLoading) {
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
    parentMessage: nextValue.parentMessage,
    replyCount: nextValue.replyCount,
  }) as const;

const ThreadFooterComponentWithContext = (props: ThreadFooterComponentPropsWithContext) => {
  const { parentMessagePreventPress, threadInstance } = props;
  const { Message } = useComponentsContext();
  const { t } = useTranslationContext();

  const styles = useStyles();

  // The parent message is read reactively from the thread instance so the header updates live when
  // it is edited / reacted to / its reply_count changes.
  const { parentMessage, replyCount = parentMessage?.reply_count } =
    useStateStore(threadInstance?.state, selector) ?? {};

  if (!parentMessage) {
    return null;
  }

  return (
    <View style={styles.threadHeaderContainer} testID='thread-footer-component'>
      <Message
        groupStyles={['single']}
        message={parentMessage}
        preventPress={parentMessagePreventPress}
        readBy={0}
        threadList
      />
      <View style={styles.newThread}>
        <Text style={styles.text}>
          {replyCount === 1
            ? t('message.replies.one.label', '1 Reply')
            : t('message.replies.many.label', '{{ replyCount }} Replies', {
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
  // The parent message + reply count are read reactively from `threadInstance.state` inside the
  // component (via useStateStore), so this memo only needs to gate parent-driven re-renders on the
  // remaining props: the prevent-press flag and the thread instance identity.
  const {
    parentMessagePreventPress: prevParentMessagePreventPress,
    threadInstance: prevThreadInstance,
  } = prevProps;
  const {
    parentMessagePreventPress: nextParentMessagePreventPress,
    threadInstance: nextThreadInstance,
  } = nextProps;

  return (
    prevParentMessagePreventPress === nextParentMessagePreventPress &&
    prevThreadInstance === nextThreadInstance
  );
};

const MemoizedThreadFooter = React.memo(
  ThreadFooterComponentWithContext,
  areEqual,
) as typeof ThreadFooterComponentWithContext;

export type ThreadFooterComponentProps = Partial<
  Pick<ThreadContextValue, 'parentMessagePreventPress'>
>;

export const ThreadFooterComponent = (props: ThreadFooterComponentProps) => {
  const { parentMessagePreventPress, threadInstance } = useThreadContext();

  return (
    <MemoizedThreadFooter
      {...{
        parentMessagePreventPress,
        threadInstance,
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
