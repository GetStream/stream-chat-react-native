import { useMemo } from 'react';

import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';

// The ThreadContext now carries only the Thread instance (+ a few UI-config props). Reply data,
// pagination and loading state — and the parent message — are read by consumers straight off
// `thread.messagePaginator` / `thread.state` via useStateStore.
export const useCreateThreadContext = ({
  allowThreadMessagesInChannel,
  onAlsoSentToChannelHeaderPress,
  thread,
}: Pick<
  ThreadContextValue,
  'allowThreadMessagesInChannel' | 'onAlsoSentToChannelHeaderPress' | 'thread'
>): ThreadContextValue =>
  useMemo(
    () => ({
      allowThreadMessagesInChannel,
      onAlsoSentToChannelHeaderPress,
      thread,
    }),
    [allowThreadMessagesInChannel, onAlsoSentToChannelHeaderPress, thread],
  );
