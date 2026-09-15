import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  InlineDateSeparator,
  InlineDateSeparatorProps,
  useChannelContext,
  usePaginatedMessageListContext,
  useThreadContext,
} from 'stream-chat-react-native';

/**
 * Date separator that hides itself on days where every message is a system
 * message (e.g. "X was added to the channel"), so a day of pure membership
 * noise does not get its own date header.
 *
 * The message list is read from context rather than taken as a prop on purpose.
 * The verdict has to be re-evaluated whenever more of that day becomes known —
 * either by paginating older messages in, or by a regular message arriving on a
 * day that so far held only system messages — and the SDK re-renders the owning
 * `MessageWrapper` only when its own message/neighbour props change. Consider a
 * day holding system messages S1 then S2: the separator sits on S1, and a new
 * regular message does not touch S1's `nextMessage` (still S2), so the wrapper's
 * memo blocks it. Subscribing to `PaginatedMessageListContext` — whose value is
 * memoized on a per-message digest of the whole list — gives us that re-render.
 *
 * `toDateString()` is deliberate: it is the exact day boundary the SDK's
 * `getDateSeparatorValue` uses to decide where a separator goes, so placement
 * and visibility can never disagree at a timezone edge.
 */
export const SystemAwareInlineDateSeparator = ({ date }: InlineDateSeparatorProps) => {
  const { messages } = usePaginatedMessageListContext();
  const { threadMessages } = useThreadContext();
  const { threadList } = useChannelContext();

  const messageList = threadList ? threadMessages : messages;

  const hasNonSystemMessage = useMemo(() => {
    if (!date) {
      return false;
    }
    const day = date.toDateString();
    return messageList.some(
      (message) => message.type !== 'system' && message.created_at.toDateString() === day,
    );
  }, [date, messageList]);

  if (!hasNonSystemMessage) {
    return null;
  }

  return (
    <View style={styles.container}>
      <InlineDateSeparator date={date} />
    </View>
  );
};

const styles = StyleSheet.create({
  /**
   * The SDK wraps whatever `InlineDateSeparator` renders in a `View` that carries
   * `paddingVertical: primitives.spacingXs`. Returning `null` above would leave
   * that padding behind as an empty gap, so the app zeroes it through the theme
   * (`messageList.inlineDateSeparatorContainer`, see `useStreamChatTheme`) and
   * re-adds the same spacing here, only when the separator actually renders.
   */
  container: { paddingVertical: 8 },
});
