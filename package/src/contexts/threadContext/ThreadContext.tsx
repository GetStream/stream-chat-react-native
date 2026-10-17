import React, { PropsWithChildren, useContext } from 'react';

import { Thread } from 'stream-chat';

export type AlsoSentToChannelHeaderPressPayload = {
  targetedMessageId: string;
  thread?: Thread;
};

export type ThreadContextValue = {
  allowThreadMessagesInChannel: boolean;
  /**
   * The thread this subtree renders. Set by `<Thread>`; `undefined` everywhere else.
   */
  thread?: Thread;
};

/**
 * What `useThreadContext()` returns outside a `<Thread>`. Only `<Thread>` provides this context, so
 * its absence is how a component knows it is not rendering a thread.
 */
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
 * The thread the calling component renders, if any. Unlike the other context hooks this one does not
 * throw outside its provider: outside a `<Thread>` it returns `{ thread: undefined }`.
 */
export const useThreadContext = () => useContext(ThreadContext);
