import React, { PropsWithChildren, useContext } from 'react';

import { Thread } from 'stream-chat';

export type AlsoSentToChannelHeaderPressPayload = {
  targetedMessageId: string;
  thread?: Thread;
};

export type ThreadContextValue = {
  allowThreadMessagesInChannel: boolean;
  /** The thread this subtree renders. Set by `<Thread>`, `undefined` elsewhere. */
  thread?: Thread;
};

/** What `useThreadContext()` returns outside a `<Thread>`, the only provider of this context. */
const NO_THREAD_CONTEXT_VALUE: ThreadContextValue = {
  allowThreadMessagesInChannel: false,
  thread: undefined,
};

export const ThreadContext = React.createContext<ThreadContextValue>(NO_THREAD_CONTEXT_VALUE);

export const ThreadProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ThreadContextValue;
}>) => <ThreadContext.Provider value={value}>{children}</ThreadContext.Provider>;

/**
 * The thread the calling component renders, if any. Unlike the other context hooks it does not
 * throw outside its provider: it returns `{ thread: undefined }`.
 */
export const useThreadContext = () => useContext(ThreadContext);
