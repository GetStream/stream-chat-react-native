import React, { PropsWithChildren, useContext } from 'react';

import { Channel, LocalMessage, Thread } from 'stream-chat';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

export type ThreadListItemContextValue = {
  channel: Channel;
  dateString: string | number | undefined;
  deletedAtDateString: string | number | undefined;
  lastReply: LocalMessage | undefined;
  ownUnreadMessageCount: number;
  parentMessage: LocalMessage | undefined;
  thread: Thread;
};

export const ThreadListItemContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ThreadListItemContextValue,
);

export const ThreadListItemProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ThreadListItemContextValue;
}>) => (
  <ThreadListItemContext.Provider value={value as unknown as ThreadListItemContextValue}>
    {children}
  </ThreadListItemContext.Provider>
);

export const useThreadListItemContext = () =>
  useContext(ThreadListItemContext) as unknown as ThreadListItemContextValue;
