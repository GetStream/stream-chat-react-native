import React, { PropsWithChildren, useContext } from 'react';
import type { Channel, StreamChat, UnknownType } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
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
  <ChatContext.Provider value={(value as unknown) as ChatContextValue}>
    {children}
  </ChatContext.Provider>
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
