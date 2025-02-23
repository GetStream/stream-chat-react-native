import React, { PropsWithChildren, useContext } from 'react';
import type { ImageProps } from 'react-native';

import type { AppSettingsAPIResponse, Channel, Mute, StreamChat } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { MessageContextValue } from '../messageContext/MessageContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ChatContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  /**
   * Object of application settings returned from Stream.
   * */
  appSettings: AppSettingsAPIResponse<StreamChatGenerics> | null;
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
  client: StreamChat<StreamChatGenerics>;
  connectionRecovering: boolean;
  enableOfflineSupport: boolean;
  /**
   * Drop in replacement of all the underlying Image components within SDK. This is useful for the purpose of offline caching of images. Please check the Offline Support Guide for usage.
   */
  ImageComponent: React.ComponentType<ImageProps>;
  isOnline: boolean | null;
  mutedUsers: Mute<StreamChatGenerics>[];
  /**
   * @param newChannel Channel to set as active.
   *
   * @overrideType Function
   */
  setActiveChannel: (newChannel?: Channel<StreamChatGenerics>) => void;
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
  channel?: Channel<StreamChatGenerics>;
} & Partial<Pick<MessageContextValue<StreamChatGenerics>, 'isMessageAIGenerated'>>;

export const ChatContext = React.createContext(DEFAULT_BASE_CONTEXT_VALUE as ChatContextValue);

export const ChatProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
  value,
}: PropsWithChildren<{
  value?: ChatContextValue<StreamChatGenerics>;
}>) => (
  <ChatContext.Provider value={value as unknown as ChatContextValue}>
    {children}
  </ChatContext.Provider>
);

export const useChatContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  const contextValue = useContext(ChatContext) as unknown as ChatContextValue<StreamChatGenerics>;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useChatContext hook was called outside the ChatContext Provider. Make sure you have configured Chat component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#chat',
    );
  }

  return contextValue;
};
