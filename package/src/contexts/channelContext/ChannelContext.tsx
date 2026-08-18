import React, { PropsWithChildren, useContext } from 'react';

import type { Channel } from 'stream-chat';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ChannelContextValue = {
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
   *
   * <Chat client={client}>
   *  <Channel channel={channel}>
   *  </Channel>
   * </Chat>
   * ```
   *
   * @overrideType Channel
   */
  channel: Channel;
  /**
   * When set to true, reactions will be limited to 1 per user. If user selects another reaction
   * then his previous reaction will be removed and replaced with new one.
   *
   * This is similar to reaction UX on [iMessage application](https://en.wikipedia.org/wiki/IMessage).
   */
  enforceUniqueReaction: boolean;
  error: boolean | Error;
  /**
   * Hide inline date separators on channel
   */
  hideDateSeparators: boolean;
  hideStickyDateHeader: boolean;
  /**
   * Loads channel around a specific message. Emits `messageFocusSignal` on the paginator, which
   * drives the highlight + scroll-to-target.
   * @param limit - The number of messages to load around the message
   * @param messageId - The message around which to load messages
   */
  loadChannelAroundMessage: ({
    limit,
    messageId,
  }: {
    limit?: number;
    messageId?: string;
  }) => Promise<void>;

  /**
   * Loads channel at first unread message. Emits `messageFocusSignal` on the paginator.
   * @param limit - The number of messages to load around the first unread message
   */
  loadChannelAtFirstUnreadMessage: (options?: { limit?: number }) => Promise<void>;

  reloadChannel: () => Promise<void>;
  scrollToFirstUnreadThreshold: number;
  /**
   * Returns true when Channel is about to load an initial targeted message.
   *
   * @internal
   */
  hasPendingInitialTargetLoad?: () => boolean;
  disabled?: boolean;
  enableMessageGroupingByUser?: boolean;
  /**
   * Id of message, which is highlighted in the channel.
   */
  highlightedMessageId?: string;
  isChannelActive?: boolean;
  loading?: boolean;
  /**
   * Maximum time in milliseconds that should occur between messages
   * to still consider them grouped together
   */
  maxTimeBetweenGroupedMessages?: number;
  /**
   * The maximum number of messages that can be loaded into the state when new messages arrive.
   * Any excess messages will be pruned from the back of the list (oldest first), unless we are
   * currently near them within the viewport.
   */
  maximumMessageLimit?: number;
  threadList?: boolean;
};

export const ChannelContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelContextValue,
);

export const ChannelProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ChannelContextValue;
}>) => (
  <ChannelContext.Provider value={value as unknown as ChannelContextValue}>
    {children}
  </ChannelContext.Provider>
);

export const useChannelContext = () => {
  const contextValue = useContext(ChannelContext) as unknown as ChannelContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useChannelContext hook was called outside of the ChannelContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel',
    );
  }

  return contextValue;
};
