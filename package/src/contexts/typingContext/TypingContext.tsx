import React, { PropsWithChildren, useContext } from 'react';

import type { ChannelState } from 'stream-chat';

import type { StreamChatGenerics } from '../../types/types';
import { getDisplayName } from '../utils/getDisplayName';

export type TypingContextValue<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = {
  typing: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['typing'];
};

export const TypingContext = React.createContext({} as TypingContextValue);

export const TypingProvider = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>({
  children,
  value,
}: PropsWithChildren<{
  value: TypingContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <TypingContext.Provider value={value as unknown as TypingContextValue}>
    {children}
  </TypingContext.Provider>
);

export const useTypingContext = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>() => useContext(TypingContext) as unknown as TypingContextValue<At, Ch, Co, Ev, Me, Re, Us>;

/**
 * Typescript currently does not support partial inference so if TypingContext
 * typing is desired while using the HOC withTypingContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withTypingContext = <P extends UnknownType, StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof TypingContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithTypingContextComponent = (
    props: Omit<P, keyof TypingContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const typingContext = useTypingContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...typingContext} />;
  };
  WithTypingContextComponent.displayName = `WithTypingContext${getDisplayName(Component)}`;
  return WithTypingContextComponent;
};
