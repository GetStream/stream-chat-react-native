import React, { PropsWithChildren, useContext } from 'react';

import { getDisplayName } from '../utils/getDisplayName';

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

export type ChannelsContextValue<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {};

export const ChannelsContext = React.createContext({} as ChannelsContextValue);

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: PropsWithChildren<{
    value: ChannelsContextValue<At, Ch, Co, Ev, Me, Re, Us>;
  }>,
  nextProps: PropsWithChildren<{
    value: ChannelsContextValue<At, Ch, Co, Ev, Me, Re, Us>;
  }>,
) => {
  const {
    value: {},
  } = prevProps;
  const {
    value: {},
  } = nextProps;

  return true;
};

const ChannelsProviderMemoized = React.memo(
  ChannelsContext.Provider,
  areEqual,
) as typeof ChannelsContext.Provider;

export const ChannelsProvider = <
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
  value: ChannelsContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <ChannelsProviderMemoized value={(value as unknown) as ChannelsContextValue}>
    {children}
  </ChannelsProviderMemoized>
);

export const useChannelsContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>() =>
  (useContext(ChannelsContext) as unknown) as ChannelsContextValue<
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
 * typing is desired while using the HOC withChannelContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChannelsContext = <
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
): React.FC<
  Omit<P, keyof ChannelsContextValue<At, Ch, Co, Ev, Me, Re, Us>>
> => {
  const WithChannelsContextComponent = (
    props: Omit<P, keyof ChannelsContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const channelsContext = useChannelsContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...channelsContext} />;
  };
  WithChannelsContextComponent.displayName = `WithChannelsContext${getDisplayName(
    Component,
  )}`;
  return WithChannelsContextComponent;
};
