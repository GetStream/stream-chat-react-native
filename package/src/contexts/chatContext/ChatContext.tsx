import React, { PropsWithChildren, useContext } from 'react';

import type { GetApplicationResponse, LocalMessage, StreamChat } from 'stream-chat';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ChatContextValue = {
  /**
   * Resolves the application settings returned from Stream. The first call fetches them and later
   * calls reuse the result. With offline support enabled, it falls back to the copy stored in the
   * offline database while the request cannot be made.
   */
  getAppSettings: () => Promise<GetApplicationResponse>;
  /**
   * The `StreamChat` client.
   *
   * ```
   * import { StreamChat } from 'stream-chat';
   * import { Chat } from 'stream-chat-react-native';
   *
   * const client = StreamChat.getInstance('api_key');
   * await client.connectUser('user_id', 'userToken');
   *
   * <Chat client={client}>
   * </Chat>
   * ```
   *
   * @overrideType StreamChat
   * */
  client: StreamChat;
  /** Decides whether a message renders as AI generated. Defaults to never. */
  isMessageAIGenerated: (message: LocalMessage) => boolean;
};

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
