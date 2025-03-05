import React, { PropsWithChildren, useContext } from 'react';

import { Channel, Thread } from 'stream-chat';

import { MessageType } from '../../components';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

export type ThreadListItemContextValue = {
  channel: Channel;
  dateString: string | number | undefined;
  deletedAtDateString: string | number | undefined;
  lastReply: MessageType | undefined;
  ownUnreadMessageCount: number;
  parentMessage: MessageType | undefined;
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
