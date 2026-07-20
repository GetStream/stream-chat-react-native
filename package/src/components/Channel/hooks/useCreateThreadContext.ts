import { useMemo } from 'react';

import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';

// The ThreadContext now carries only the Thread instance (+ a few UI-config props). Reply data,
// pagination and loading state — and the parent message — are read by consumers straight off
// `threadInstance.messagePaginator` / `threadInstance.state` via useStateStore.
export const useCreateThreadContext = ({
  allowThreadMessagesInChannel,
  onAlsoSentToChannelHeaderPress,
  threadInstance,
}: Pick<
  ThreadContextValue,
  'allowThreadMessagesInChannel' | 'onAlsoSentToChannelHeaderPress' | 'threadInstance'
>): ThreadContextValue =>
  useMemo(
    () => ({
      allowThreadMessagesInChannel,
      onAlsoSentToChannelHeaderPress,
      threadInstance,
    }),
    [allowThreadMessagesInChannel, onAlsoSentToChannelHeaderPress, threadInstance],
  );
