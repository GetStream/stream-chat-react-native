import React, { PropsWithChildren, useContext } from 'react';

import type { AppSettingsAPIResponse, Channel, EventHandler, Mute, StreamChat } from 'stream-chat';

import type { DefaultStreamChatGenerics, UnknownType } from '../../types/types';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { getDisplayName } from '../utils/getDisplayName';
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
  isOnline: boolean;
  mutedUsers: Mute<StreamChatGenerics>[];
  /**
   * @param newChannel Channel to set as active.
   *
   * @overrideType Function
   */
  setActiveChannel: (newChannel?: Channel<StreamChatGenerics>) => void;
  subscribeConnectionRecoveredCallback: (callback: EventHandler<StreamChatGenerics>) => () => void;
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
};

export const ChatContext = React.createContext(DEFAULT_BASE_CONTEXT_VALUE as ChatContextValue);

export const ChatProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
  value,
}: PropsWithChildren<{
  value: ChatContextValue<StreamChatGenerics>;
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
      `The useChatContext hook was called outside the ChatContext Provider. Make sure you have configured Chat component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#chat`,
    );
  }

  return contextValue;
};

/**
 * Typescript currently does not support partial inference so if ChatContext
 * typing is desired while using the HOC withChatContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChatContext = <
  P extends UnknownType,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ChatContextValue<StreamChatGenerics>>> => {
  const WithChatContextComponent = (props: Omit<P, keyof ChatContextValue<StreamChatGenerics>>) => {
    const chatContext = useChatContext<StreamChatGenerics>();

    return <Component {...(props as P)} {...chatContext} />;
  };
  WithChatContextComponent.displayName = `WithChatContext${getDisplayName(Component)}`;
  return WithChatContextComponent;
};
