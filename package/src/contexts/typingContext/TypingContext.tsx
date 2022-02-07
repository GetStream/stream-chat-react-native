import React, { PropsWithChildren, useContext } from 'react';

import type { ChannelState, ExtendableGenerics } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { getDisplayName } from '../utils/getDisplayName';

export type TypingContextValue<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = {
  typing: ChannelState<StreamChatClient>['typing'];
};

export const TypingContext = React.createContext({} as TypingContextValue);

export const TypingProvider = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>({
  children,
  value,
}: PropsWithChildren<{
  value: TypingContextValue<StreamChatClient>;
}>) => (
  <TypingContext.Provider value={value as unknown as TypingContextValue}>
    {children}
  </TypingContext.Provider>
);

export const useTypingContext = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>() => useContext(TypingContext) as unknown as TypingContextValue<StreamChatClient>;

/**
 * Typescript currently does not support partial inference so if TypingContext
 * typing is desired while using the HOC withTypingContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withTypingContext = <
  P extends UnknownType,
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof TypingContextValue<StreamChatClient>>> => {
  const WithTypingContextComponent = (
    props: Omit<P, keyof TypingContextValue<StreamChatClient>>,
  ) => {
    const typingContext = useTypingContext<StreamChatClient>();

    return <Component {...(props as P)} {...typingContext} />;
  };
  WithTypingContextComponent.displayName = `WithTypingContext${getDisplayName(Component)}`;
  return WithTypingContextComponent;
};
