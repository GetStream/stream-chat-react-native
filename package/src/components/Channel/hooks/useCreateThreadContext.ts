import { useMemo } from 'react';

import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';

export const useCreateThreadContext = ({
  allowThreadMessagesInChannel,
  thread,
}: Pick<ThreadContextValue, 'allowThreadMessagesInChannel' | 'thread'>): ThreadContextValue =>
  useMemo(
    () => ({
      allowThreadMessagesInChannel,
      thread,
    }),
    [allowThreadMessagesInChannel, thread],
  );
