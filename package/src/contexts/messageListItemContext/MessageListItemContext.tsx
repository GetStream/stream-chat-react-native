import React, { createContext, PropsWithChildren, useContext } from 'react';

import { MessageListProps } from '../../components/MessageList/MessageList';
import { MessagePreviousAndNextMessageStore } from '../../state-store/message-list-prev-next-state';

import { Theme } from '../themeContext/utils/theme';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

export type MessageListItemContextValue = {
  /**
   * Handler to go to a particular message when its quoted.
   *
   * @param messageId The id of the message to go to.
   * @returns void
   */
  goToMessage: (messageId: string) => void;
  /**
   * Store to get the previous and next message in the message list
   */
  messageListPreviousAndNextMessageStore: MessagePreviousAndNextMessageStore;
  /**
   * Theme to use for the message list item
   */
  modifiedTheme: Theme;
  /**
   * Whether to group messages by user
   */
  noGroupByUser?: boolean;
  /**
   * Handler to open the thread on message. This is callback for touch event for replies button.
   *
   * @param message A message object to open the thread upon.
   */
  onThreadSelect: MessageListProps['onThreadSelect'];
};

export const MessageListItemContext = createContext(
  DEFAULT_BASE_CONTEXT_VALUE as MessageListItemContextValue,
);

export const MessageListItemProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value?: MessageListItemContextValue;
}>) => (
  <MessageListItemContext.Provider value={value as unknown as MessageListItemContextValue}>
    {children}
  </MessageListItemContext.Provider>
);

export const useMessageListItemContext = () => {
  const contextValue = useContext(MessageListItemContext) as unknown as MessageListItemContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useMessageListItemContext hook was called outside of the MessageListItemContext provider. Make sure you have configured MessageListItem component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#message-list',
    );
  }

  return contextValue;
};
