import { useMemo } from 'react';

import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';

// The ThreadContext now carries only the Thread instance (+ a few UI-config props). Reply data,
// pagination and loading state are read by consumers straight off `threadInstance.messagePaginator`
// / `threadInstance.state` via useStateStore — there is no derived state to assemble here.
export const useCreateThreadContext = ({
  allowThreadMessagesInChannel,
  onAlsoSentToChannelHeaderPress,
  thread,
  threadInstance,
}: Pick<
  ThreadContextValue,
  'allowThreadMessagesInChannel' | 'onAlsoSentToChannelHeaderPress' | 'thread' | 'threadInstance'
>): ThreadContextValue =>
  useMemo(
    () => ({
      allowThreadMessagesInChannel,
      onAlsoSentToChannelHeaderPress,
      thread,
      threadInstance,
    }),
    [allowThreadMessagesInChannel, onAlsoSentToChannelHeaderPress, thread, threadInstance],
  );
