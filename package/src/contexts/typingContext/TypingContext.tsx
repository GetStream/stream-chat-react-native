import React, { PropsWithChildren, useContext } from 'react';

import type { ChannelState } from 'stream-chat';

import type { DefaultStreamChatGenerics, UnknownType } from '../../types/types';
import { getDisplayName } from '../utils/getDisplayName';

export type TypingContextValue<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  typing: ChannelState<StreamChatClient>['typing'];
};

export const TypingContext = React.createContext({} as TypingContextValue);

export const TypingProvider = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
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
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => useContext(TypingContext) as unknown as TypingContextValue<StreamChatClient>;

/**
 * Typescript currently does not support partial inference so if TypingContext
 * typing is desired while using the HOC withTypingContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withTypingContext = <
  P extends UnknownType,
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
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
