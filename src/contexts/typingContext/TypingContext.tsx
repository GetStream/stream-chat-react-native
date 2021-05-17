import React, { PropsWithChildren, useContext } from 'react';

import { getDisplayName } from '../utils/getDisplayName';

import type { ChannelState } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

export type TypingContextValue<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  typing: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['typing'];
};

export const TypingContext = React.createContext({} as TypingContextValue);

export const TypingProvider = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  children,
  value,
}: PropsWithChildren<{
  value: TypingContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <TypingContext.Provider value={(value as unknown) as TypingContextValue}>
    {children}
  </TypingContext.Provider>
);

export const useTypingContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>() =>
  (useContext(TypingContext) as unknown) as TypingContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >;

/**
 * Typescript currently does not support partial inference so if TypingContext
 * typing is desired while using the HOC withTypingContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withTypingContext = <
  P extends UnknownType,
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof TypingContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithTypingContextComponent = (
    props: Omit<P, keyof TypingContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const typingContext = useTypingContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...typingContext} />;
  };
  WithTypingContextComponent.displayName = `WithTypingContext${getDisplayName(
    Component,
  )}`;
  return WithTypingContextComponent;
};
