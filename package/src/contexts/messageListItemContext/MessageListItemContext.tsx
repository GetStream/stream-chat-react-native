import React, { createContext, PropsWithChildren, useContext } from 'react';

import type { LocalMessage } from 'stream-chat';

import { MessageListProps } from '../../components/MessageList/MessageList';

import { Theme } from '../themeContext/utils/theme';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

/**
 * Goes to a message, used when a quoted message is pressed.
 *
 * @param messageId The ID of the message to go to.
 * @param message The message, when the caller has it (the pressed quote passes its quoted message).
 */
export type GoToMessage = (
  messageId: string,
  message?: NonNullable<LocalMessage['quoted_message']>,
) => void;

export type MessageListItemContextValue = {
  /** Goes to a message, used when a quoted message is pressed. */
  goToMessage: GoToMessage;
  /** The theme of the list items, with `myMessageTheme` merged in. */
  modifiedTheme: Theme;
  /** Turns off grouping of consecutive messages by user. */
  noGroupByUser?: boolean;
  /**
   * Called when the replies button is pressed.
   *
   * @param thread The thread to open.
   */
  onThreadSelect: MessageListProps['onThreadSelect'];
  setNativeScrollability: (value: boolean) => void;
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
      'The useMessageListItemContext hook was called outside of the MessageListItemContext provider. Make sure you have configured MessageList component correctly - https://getstream.io/chat/docs/sdk/react-native/ui-components/message-list/',
    );
  }

  return contextValue;
};
