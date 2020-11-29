import React, { PropsWithChildren, useContext } from 'react';

import { getDisplayName } from '../utils/getDisplayName';

import type { Channel, StreamChat } from 'stream-chat';

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

export type ChatContextValue<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  connectionRecovering: boolean;
  isOnline: boolean;
  logger: (message?: string | undefined) => void;
  setActiveChannel: (newChannel?: Channel<At, Ch, Co, Ev, Me, Re, Us>) => void;
  channel?: Channel<At, Ch, Co, Ev, Me, Re, Us>;
};

export const ChatContext = React.createContext({} as ChatContextValue);

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
    value: ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>;
  }>,
  nextProps: PropsWithChildren<{
    value: ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>;
  }>,
) => {
  const {
    value: {
      channel: prevChannel,
      client: prevClient,
      connectionRecovering: prevConnectionRecovering,
      isOnline: prevIsOnline,
    },
  } = prevProps;
  const {
    value: {
      channel: nextChannel,
      client: nextClient,
      connectionRecovering: nextConnectionRecovering,
      isOnline: nextIsOnline,
    },
  } = nextProps;

  const connectionRecoveringEqual =
    prevConnectionRecovering === nextConnectionRecovering;
  if (!connectionRecoveringEqual) return false;

  const isOnlineEqual = prevIsOnline === nextIsOnline;
  if (!isOnlineEqual) return false;

  const channelEqual =
    !!prevChannel && !!nextChannel && prevChannel.id === nextChannel.id;
  if (!channelEqual) return false;

  const clientEqual =
    prevClient.clientID === nextClient.clientID &&
    Object.keys(prevClient.activeChannels).length ===
      Object.keys(nextClient.activeChannels).length &&
    Object.keys(prevClient.listeners).length ===
      Object.keys(nextClient.listeners).length &&
    prevClient.mutedChannels.length === nextClient.mutedChannels.length;
  if (!clientEqual) return false;

  return true;
};

const ChatProviderMemoized = React.memo(
  ChatContext.Provider,
  areEqual,
) as typeof ChatContext.Provider;

export const ChatProvider = <
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
  value: ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <ChatProviderMemoized value={(value as unknown) as ChatContextValue}>
    {children}
  </ChatProviderMemoized>
);

export const useChatContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
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
