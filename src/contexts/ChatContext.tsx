import React, { PropsWithChildren, useContext } from 'react';
import type {
  Channel,
  LiteralStringForUnion,
  StreamChat,
  UnknownType,
} from 'stream-chat';

export type ChatContextValue<
  ChannelType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  AttachmentType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  EventType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion
> = {
  client: StreamChat<
    ChannelType,
    UserType,
    MessageType,
    AttachmentType,
    ReactionType,
    EventType,
    CommandType
  >;
  connectionRecovering: boolean;
  isOnline: boolean;
  logger: (message?: string | undefined) => void;
  setActiveChannel: (
    newChannel?: Channel<
      AttachmentType,
      ChannelType,
      EventType,
      MessageType,
      ReactionType,
      UserType,
      CommandType
    >,
  ) => void;
  channel?: Channel<
    AttachmentType,
    ChannelType,
    EventType,
    MessageType,
    ReactionType,
    UserType,
    CommandType
  >;
};

export const ChatContext = React.createContext({} as ChatContextValue);

export const ChatProvider = <
  ChannelType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  AttachmentType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  EventType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion
>({
  children,
  value,
}: PropsWithChildren<{
  value: ChatContextValue<
    ChannelType,
    UserType,
    MessageType,
    AttachmentType,
    ReactionType,
    EventType,
    CommandType
  >;
}>) => (
  <ChatContext.Provider value={(value as unknown) as ChatContextValue}>
    {children}
  </ChatContext.Provider>
);

export const useChatContext = <
  ChannelType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  AttachmentType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  EventType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion
>() =>
  (useContext(ChatContext) as unknown) as ChatContextValue<
    ChannelType,
    UserType,
    MessageType,
    AttachmentType,
    ReactionType,
    EventType,
    CommandType
  >;
