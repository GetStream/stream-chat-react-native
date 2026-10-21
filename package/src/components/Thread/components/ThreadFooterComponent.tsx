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

type ThreadFooterComponentPropsWithContext = Pick<ThreadContextValue, 'thread'> & {
  /** Whether pressing the parent message is disabled. Defaults to true. */
  parentMessagePreventPress?: boolean;
};

const loadingSelector = (state: { isLoading: boolean }) => ({ isLoading: state.isLoading });

export const InlineLoadingMoreThreadIndicator = () => {
  const { thread } = useThreadContext();
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();
  const { isLoading } = useStateStore(thread?.messagePaginator?.state, loadingSelector) ?? {};

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
  const { parentMessagePreventPress = true, thread } = props;
  const { Message } = useComponentsContext();
  const { t } = useTranslationContext();

  const styles = useStyles();

  // Read from the thread state so the header updates when the parent message or its reply count
  // changes.
  const { parentMessage, replyCount = parentMessage?.reply_count } =
    useStateStore(thread?.state, selector) ?? {};

  if (!parentMessage) {
    return null;
  }

  return (
    <View style={styles.threadHeaderContainer} testID='thread-footer-component'>
      <Message
        groupStyles={['single']}
        message={parentMessage}
        preventPress={parentMessagePreventPress}
        showMessageStatus={false}
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
  // The parent message and reply count come from `thread.state`, so only the prevent-press flag
  // and the thread identity gate re-renders.
  const { parentMessagePreventPress: prevParentMessagePreventPress, thread: prevThread } =
    prevProps;
  const { parentMessagePreventPress: nextParentMessagePreventPress, thread: nextThread } =
    nextProps;

  return (
    prevParentMessagePreventPress === nextParentMessagePreventPress && prevThread === nextThread
  );
};

const MemoizedThreadFooter = React.memo(
  ThreadFooterComponentWithContext,
  areEqual,
) as typeof ThreadFooterComponentWithContext;

export type ThreadFooterComponentProps = Partial<
  Pick<ThreadFooterComponentPropsWithContext, 'parentMessagePreventPress'>
>;

export const ThreadFooterComponent = (props: ThreadFooterComponentProps) => {
  const { thread } = useThreadContext();

  return <MemoizedThreadFooter thread={thread} {...props} />;
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
