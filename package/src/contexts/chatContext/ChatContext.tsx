import React, { PropsWithChildren, useContext } from 'react';

import type { Channel, Mute, StreamChat } from 'stream-chat';

import type { StreamChatGenerics } from '../../types/types';
import { getDisplayName } from '../utils/getDisplayName';

export type ChatContextValue<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = {
  /**
   * The StreamChat client object
   *
   * ```
   * import { StreamChat } from 'stream-chat';
   * import { Chat } from 'stream-chat-react-native';
   *
   * const client = StreamChat.getInstance('api_key);
   * await client.connectUser('user_id', 'userToken');
   *
   * <Chat client={client}>
   * </Chat>
   * ```
   *
   * @overrideType StreamChat
   * */
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  connectionRecovering: boolean;
  isOnline: boolean;
  mutedUsers: Mute<Us>[];
  /**
   * @param newChannel Channel to set as active.
   *
   * @overrideType Function
   */
  setActiveChannel: (newChannel?: Channel<At, Ch, Co, Ev, Me, Re, Us>) => void;
  /**
   * Instance of channel object from stream-chat package.
   *
   * Please check the docs around how to create or query channel - https://getstream.io/chat/docs/javascript/creating_channels/?language=javascript
   *
   * ```
   * import { StreamChat, Channel } from 'stream-chat';
   * import { Chat, Channel} from 'stream-chat-react-native';
   *
   * const client = StreamChat.getInstance('api_key');
   * await client.connectUser('user_id', 'user_token');
   * const channel = client.channel('messaging', 'channel_id');
   * await channel.watch();
   * ```
   *
   * @overrideType Channel
   */
  channel?: Channel<At, Ch, Co, Ev, Me, Re, Us>;
};

export const ChatContext = React.createContext({} as ChatContextValue);

export const ChatProvider = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>({
  children,
  value,
}: PropsWithChildren<{
  value: ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <ChatContext.Provider value={value as unknown as ChatContextValue}>
    {children}
  </ChatContext.Provider>
);

export const useChatContext = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>() => useContext(ChatContext) as unknown as ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>;

/**
 * Typescript currently does not support partial inference so if ChatContext
 * typing is desired while using the HOC withChatContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChatContext = <P extends UnknownType, StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithChatContextComponent = (
    props: Omit<P, keyof ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const chatContext = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...chatContext} />;
  };
  WithChatContextComponent.displayName = `WithChatContext${getDisplayName(Component)}`;
  return WithChatContextComponent;
};
