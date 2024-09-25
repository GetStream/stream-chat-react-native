import React, { PropsWithChildren, useContext } from 'react';

import { Channel, Thread } from 'stream-chat';

import { MessageType } from '../../components';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

export type ThreadListItemContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  channel: Channel<StreamChatGenerics>;
  dateString: string | number | undefined;
  deletedAtDateString: string | number | undefined;
  lastReply: MessageType<StreamChatGenerics> | undefined;
  ownUnreadMessageCount: number;
  parentMessage: MessageType<StreamChatGenerics> | undefined;
  thread: Thread<StreamChatGenerics>;
};

export const ThreadListItemContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ThreadListItemContextValue,
);

export const ThreadListItemProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
  value,
}: PropsWithChildren<{
  value: ThreadListItemContextValue<StreamChatGenerics>;
}>) => (
  <ThreadListItemContext.Provider value={value as unknown as ThreadListItemContextValue}>
    {children}
  </ThreadListItemContext.Provider>
);

export const useThreadListItemContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() =>
  useContext(ThreadListItemContext) as unknown as ThreadListItemContextValue<StreamChatGenerics>;
