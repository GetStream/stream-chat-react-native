import React, { PropsWithChildren, useContext } from 'react';
import type {
  Channel,
  LiteralStringForUnion,
  StreamChat,
  UnknownType,
} from 'stream-chat';

import { getDisplayName } from '../utils/getDisplayName';

export type ChatContextValue<
  At extends UnknownType = UnknownType,
  Ch extends UnknownType = UnknownType,
  Co extends string = LiteralStringForUnion,
  Ev extends UnknownType = UnknownType,
  Me extends UnknownType = UnknownType,
  Re extends UnknownType = UnknownType,
  Us extends UnknownType = UnknownType
> = {
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  connectionRecovering: boolean;
  isOnline: boolean;
  logger: (message?: string | undefined) => void;
  setActiveChannel: (newChannel?: Channel<At, Ch, Co, Ev, Me, Re, Us>) => void;
  channel?: Channel<At, Ch, Co, Ev, Me, Re, Us>;
};

export const ChatContext = React.createContext({} as ChatContextValue);

export const ChatProvider = <
  At extends UnknownType = UnknownType,
  Ch extends UnknownType = UnknownType,
  Co extends string = LiteralStringForUnion,
  Ev extends UnknownType = UnknownType,
  Me extends UnknownType = UnknownType,
  Re extends UnknownType = UnknownType,
  Us extends UnknownType = UnknownType
>({
  children,
  value,
}: PropsWithChildren<{
  value: ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <ChatContext.Provider value={(value as unknown) as ChatContextValue}>
    {children}
  </ChatContext.Provider>
);

export const useChatContext = <
  At extends UnknownType = UnknownType,
  Ch extends UnknownType = UnknownType,
  Co extends string = LiteralStringForUnion,
  Ev extends UnknownType = UnknownType,
  Me extends UnknownType = UnknownType,
  Re extends UnknownType = UnknownType,
  Us extends UnknownType = UnknownType
>() =>
  (useContext(ChatContext) as unknown) as ChatContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >;

/**
 * Typescript currently does not support partial inference so if ChatContext
 * typing is desired while using the HOC withChatContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChatContext = <
  P extends Record<string, unknown>,
  At extends UnknownType = UnknownType,
  Ch extends UnknownType = UnknownType,
  Co extends string = LiteralStringForUnion,
  Ev extends UnknownType = UnknownType,
  Me extends UnknownType = UnknownType,
  Re extends UnknownType = UnknownType,
  Us extends UnknownType = UnknownType
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithChatContextComponent = (
    props: Omit<P, keyof ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const chatContext = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...chatContext} />;
  };
  WithChatContextComponent.displayName = `WithChatContext${getDisplayName(
    Component,
  )}`;
  return WithChatContextComponent;
};
