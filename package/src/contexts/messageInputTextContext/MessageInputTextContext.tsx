import React, { PropsWithChildren, useContext, useMemo, useState } from 'react';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type MessageInputTextContextProps = {
  /** Initial value to set on input */
  initialValue: string | undefined;
};

export type MessageInputTextContextValue = MessageInputTextContextProps & {
  text: string;
  isEqualToInitialText: boolean;
  setText: React.Dispatch<React.SetStateAction<string>>;
  hasText: boolean;
};

export const MessageInputTextContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as MessageInputTextContextValue,
);

export const MessageInputTextProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: MessageInputTextContextProps;
}>) => {
  const { initialValue } = value;
  const initialTextValue = initialValue || '';
  const [text, setText] = useState(initialTextValue);
  const isEqualToInitialText = text === initialTextValue;
  const hasText = !!text && !!text.trim();

  const messageInputTextContextValue = useMemo(
    () => ({
      hasText,
      initialValue,
      isEqualToInitialText,
      setText,
      text,
    }),
    [hasText, initialValue, isEqualToInitialText, text],
  );

  return (
    <MessageInputTextContext.Provider
      value={messageInputTextContextValue as unknown as MessageInputTextContextValue}
    >
      {children}
    </MessageInputTextContext.Provider>
  );
};

export const useMessageInputTextContext = () => {
  const contextValue = useContext(
    MessageInputTextContext,
  ) as unknown as MessageInputTextContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useMessageInputTextContext hook was called outside of the MessageInputTextContext provider. Make sure you have configured the Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel',
    );
  }

  return contextValue;
};
