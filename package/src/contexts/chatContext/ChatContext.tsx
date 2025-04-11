import React, { PropsWithChildren, useContext } from 'react';
import type { ImageProps } from 'react-native';

import type { AppSettingsAPIResponse, Channel, Mute, StreamChat } from 'stream-chat';

import { MessageContextValue } from '../messageContext/MessageContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ChatContextValue = {
  /**
   * Object of application settings returned from Stream.
   * */
  appSettings: AppSettingsAPIResponse | null;
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
  client: StreamChat;
  connectionRecovering: boolean;
  enableOfflineSupport: boolean;
  /**
   * Drop in replacement of all the underlying Image components within SDK. This is useful for the purpose of offline caching of images. Please check the Offline Support Guide for usage.
   */
  ImageComponent: React.ComponentType<ImageProps>;
  isOnline: boolean | null;
  mutedUsers: Mute[];
  /**
   * @param newChannel Channel to set as active.
   *
   * @overrideType Function
   */
  setActiveChannel: (newChannel?: Channel) => void;
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
  channel?: Channel;
} & Partial<Pick<MessageContextValue, 'isMessageAIGenerated'>>;

export const ChatContext = React.createContext(DEFAULT_BASE_CONTEXT_VALUE as ChatContextValue);

export const ChatProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value?: ChatContextValue;
}>) => (
  <ChatContext.Provider value={value as unknown as ChatContextValue}>
    {children}
  </ChatContext.Provider>
);

export const useChatContext = () => {
  const contextValue = useContext(ChatContext) as unknown as ChatContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useChatContext hook was called outside the ChatContext Provider. Make sure you have configured Chat component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#chat',
    );
  }

  return contextValue;
};
