import React, { PropsWithChildren, useContext } from 'react';

import type { ChannelState } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type TypingContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  typing: ChannelState<StreamChatGenerics>['typing'];
};

export const TypingContext = React.createContext(DEFAULT_BASE_CONTEXT_VALUE as TypingContextValue);

export const TypingProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
  value,
}: PropsWithChildren<{
  value: TypingContextValue<StreamChatGenerics>;
}>) => (
  <TypingContext.Provider value={value as unknown as TypingContextValue}>
    {children}
  </TypingContext.Provider>
);

export const useTypingContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  const contextValue = useContext(
    TypingContext,
  ) as unknown as TypingContextValue<StreamChatGenerics>;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      `The useTypingContext hook was called outside of the TypingContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel`,
    );
  }

  return contextValue;
};
