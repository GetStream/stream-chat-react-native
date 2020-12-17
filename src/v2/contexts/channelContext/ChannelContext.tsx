import React, { PropsWithChildren, useContext } from 'react';

import { getDisplayName } from '../utils/getDisplayName';

import type { Channel, ChannelState, Event } from 'stream-chat';

import type { EmptyStateProps } from '../../components/Indicators/EmptyStateIndicator';
import type { LoadingProps } from '../../components/Indicators/LoadingIndicator';
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

export type ChannelContextValue<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  EmptyStateIndicator: React.ComponentType<EmptyStateProps>;
  error: boolean;
  eventHistory: { [key: string]: Event<At, Ch, Co, Ev, Me, Re, Us>[] };
  giphyEnabled: boolean;
  /**
   * Returns true if the current user has admin privileges
   */
  isAdmin: boolean;
  /**
   * Returns true if the current user is a moderator
   */
  isModerator: boolean;
  /**
   * Returns true if the current user is a owner
   */
  isOwner: boolean;
  loading: boolean;
  /**
   * Custom loading indicator to override the Stream default
   */
  LoadingIndicator: React.ComponentType<LoadingProps>;
  markRead: () => void;
  members: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['members'];
  read: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['read'];
  setLastRead: React.Dispatch<React.SetStateAction<Date | undefined>>;
  typing: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['typing'];
  watchers: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['watchers'];
  channel?: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  disabled?: boolean;
  lastRead?: Date;
  StickyHeader?: React.ComponentType<{ dateString: string }>;
  watcherCount?: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['watcher_count'];
};

export const ChannelContext = React.createContext({} as ChannelContextValue);

export const ChannelProvider = <
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
  value: ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <ChannelContext.Provider value={(value as unknown) as ChannelContextValue}>
    {children}
  </ChannelContext.Provider>
);

export const useChannelContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>() =>
  (useContext(ChannelContext) as unknown) as ChannelContextValue<
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
export const withChannelContext = <
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
): React.FC<Omit<P, keyof ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithChannelContextComponent = (
    props: Omit<P, keyof ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const channelContext = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...channelContext} />;
  };
  WithChannelContextComponent.displayName = `WithChannelContext${getDisplayName(
    Component,
  )}`;
  return WithChannelContextComponent;
};
