import React, { PropsWithChildren, useContext } from 'react';

import type { Channel, ExtendableGenerics, Mute, StreamChat } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { getDisplayName } from '../utils/getDisplayName';

export type ChatContextValue<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = {
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
  client: StreamChat<StreamChatClient>;
  connectionRecovering: boolean;
  isOnline: boolean;
  mutedUsers: Mute<StreamChatClient>[];
  /**
   * @param newChannel Channel to set as active.
   *
   * @overrideType Function
   */
  setActiveChannel: (newChannel?: Channel<StreamChatClient>) => void;
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
  channel?: Channel<StreamChatClient>;
};

export const ChatContext = React.createContext({} as ChatContextValue);

export const ChatProvider = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>({
  children,
  value,
}: PropsWithChildren<{
  value: ChatContextValue<StreamChatClient>;
}>) => (
  <ChatContext.Provider value={value as unknown as ChatContextValue}>
    {children}
  </ChatContext.Provider>
);

export const useChatContext = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>() => useContext(ChatContext) as unknown as ChatContextValue<StreamChatClient>;

/**
 * Typescript currently does not support partial inference so if ChatContext
 * typing is desired while using the HOC withChatContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChatContext = <
  P extends UnknownType,
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ChatContextValue<StreamChatClient>>> => {
  const WithChatContextComponent = (props: Omit<P, keyof ChatContextValue<StreamChatClient>>) => {
    const chatContext = useChatContext<StreamChatClient>();

    return <Component {...(props as P)} {...chatContext} />;
  };
  WithChatContextComponent.displayName = `WithChatContext${getDisplayName(Component)}`;
  return WithChatContextComponent;
};
