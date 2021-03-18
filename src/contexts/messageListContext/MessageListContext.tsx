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

export type MessageListContextValue<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /**
   * Has more messages to load
   */
  hasMore: boolean;
  /**
   * Is loading more messages
   */
  loadingMore: boolean;
  /**
   * Is loading more recent messages
   */
  loadingMoreRecent: boolean;
  /**
   * Load more messages
   */
  loadMore: () => Promise<void>;
  /**
   * Load more recent messages
   */
  loadMoreRecent: () => Promise<void>;
  /**
   * Messages from client state
   */
  messages: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messages'];
  /**
   * Set loadingMore
   */
  setLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
  /**
   * Set loadingMoreRecent
   */
  setLoadingMoreRecent: React.Dispatch<React.SetStateAction<boolean>>;
};

export const MessageListContext = React.createContext(
  {} as MessageListContextValue,
);

export const MessageListProvider = <
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
  value?: MessageListContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <MessageListContext.Provider
    value={(value as unknown) as MessageListContextValue}
  >
    {children}
  </MessageListContext.Provider>
);

export const useMessageListContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>() =>
  (useContext(MessageListContext) as unknown) as MessageListContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >;

/**
 * Typescript currently does not support partial inference so if MessageListContextValue
 * typing is desired while using the HOC withMessageListContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withMessageListContext = <
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
  Omit<P, keyof MessageListContextValue<At, Ch, Co, Ev, Me, Re, Us>>
> => {
  const WithMessageListContextComponent = (
    props: Omit<P, keyof MessageListContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const messageListContext = useMessageListContext<
      At,
      Ch,
      Co,
      Ev,
      Me,
      Re,
      Us
    >();

    return <Component {...(props as P)} {...messageListContext} />;
  };
  WithMessageListContextComponent.displayName = `WithMessageListContext${getDisplayName(
    Component,
  )}`;
  return WithMessageListContextComponent;
};
