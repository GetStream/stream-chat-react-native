import React, { PropsWithChildren, useContext } from 'react';

import type { ChannelState } from 'stream-chat';

import type { DefaultStreamChatGenerics, UnknownType } from '../../types/types';
import { getDisplayName } from '../utils/getDisplayName';

export type TypingContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  typing: ChannelState<StreamChatGenerics>['typing'];
};

export const TypingContext = React.createContext<TypingContextValue | undefined>(undefined);

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

  if (!contextValue) {
    throw new Error(
      `The useTypingContext hook was called outside of the TypingContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel`,
    );
  }

  return contextValue as TypingContextValue<StreamChatGenerics>;
};

/**
 * Typescript currently does not support partial inference so if TypingContext
 * typing is desired while using the HOC withTypingContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withTypingContext = <
  P extends UnknownType,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof TypingContextValue<StreamChatGenerics>>> => {
  const WithTypingContextComponent = (
    props: Omit<P, keyof TypingContextValue<StreamChatGenerics>>,
  ) => {
    const typingContext = useTypingContext<StreamChatGenerics>();

    return <Component {...(props as P)} {...typingContext} />;
  };
  WithTypingContextComponent.displayName = `WithTypingContext${getDisplayName(Component)}`;
  return WithTypingContextComponent;
};
