import React, { PropsWithChildren, useContext } from 'react';

import type { Channel, ChannelState } from 'stream-chat';

import { MarkReadFunctionOptions } from '../../components/Channel/Channel';
import type { EmptyStateProps } from '../../components/Indicators/EmptyStateIndicator';
import type { LoadingProps } from '../../components/Indicators/LoadingIndicator';
import { StickyHeaderProps } from '../../components/MessageList/StickyHeader';
import type { ChannelUnreadState } from '../../types/types';
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
   * Custom UI component to display empty state when channel has no messages.
   *
   * **Default** [EmptyStateIndicator](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Indicators/EmptyStateIndicator.tsx)
   */
  EmptyStateIndicator: React.ComponentType<EmptyStateProps>;
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
   * Loads channel around a specific message
   * @param limit - The number of messages to load around the message
   * @param messageId - The message around which to load messages
   * @param setTargetedMessage - Callback to set the targeted message
   */
  loadChannelAroundMessage: ({
    limit,
    messageId,
    setTargetedMessage,
  }: {
    limit?: number;
    messageId?: string;
    setTargetedMessage?: (messageId: string) => void;
  }) => Promise<void>;

  /**
   * Loads channel at first unread message.
   * @param channelUnreadState - The unread state of the channel
   * @param limit - The number of messages to load around the first unread message
   * @param setChannelUnreadState - Callback to set the channel unread state
   */
  loadChannelAtFirstUnreadMessage: ({
    channelUnreadState,
    limit,
    setTargetedMessage,
  }: {
    channelUnreadState?: ChannelUnreadState;
    limit?: number;
    setChannelUnreadState?: React.Dispatch<React.SetStateAction<ChannelUnreadState | undefined>>;
    setTargetedMessage?: (messageId: string) => void;
  }) => Promise<void>;

  /**
   * Custom loading indicator to override the Stream default
   */
  LoadingIndicator: React.ComponentType<LoadingProps>;
  markRead: (options?: MarkReadFunctionOptions) => void;
  /**
   *
   * ```json
   * {
   *   "thierry-123": {
   *     "id": "thierry-123",
   *     "role": "user",
   *     "created_at": "2019-04-03T14:42:47.087869Z",
   *     "updated_at": "2019-04-16T09:20:03.982283Z",
   *     "last_active": "2019-04-16T11:23:51.168113408+02:00",
   *     "online": true
   *   },
   *   "vishal-123": {
   *     "id": "vishal-123",
   *     "role": "user",
   *     "created_at": "2019-05-03T14:42:47.087869Z",
   *     "updated_at": "2019-05-16T09:20:03.982283Z",
   *     "last_active": "2019-06-16T11:23:51.168113408+02:00",
   *     "online": false
   *   }
   * }
   * ```
   */
  members: ChannelState['members'];
  /**
   * Custom network down indicator to override the Stream default
   */
  NetworkDownIndicator: React.ComponentType;
  read: ChannelState['read'];
  reloadChannel: () => Promise<void>;
  scrollToFirstUnreadThreshold: number;
  setChannelUnreadState: React.Dispatch<React.SetStateAction<ChannelUnreadState | undefined>>;
  setLastRead: React.Dispatch<React.SetStateAction<Date | undefined>>;
  setTargetedMessage: (messageId?: string) => void;
  /**
   * Abort controller for cancelling async requests made for uploading images/files
   * Its a map of filename and AbortController
   */
  uploadAbortControllerRef: React.MutableRefObject<Map<string, AbortController>>;
  channelUnreadState?: ChannelUnreadState;
  disabled?: boolean;
  enableMessageGroupingByUser?: boolean;
  /**
   * Id of message, which is highlighted in the channel.
   */
  highlightedMessageId?: string;
  isChannelActive?: boolean;

  lastRead?: Date;
  loading?: boolean;
  /**
   * Maximum time in milliseconds that should occur between messages
   * to still consider them grouped together
   */
  maxTimeBetweenGroupedMessages?: number;
  /**
   * Custom UI component for sticky header of channel.
   *
   * **Default** [DateHeader](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageList/DateHeader.tsx)
   */
  StickyHeader?: React.ComponentType<StickyHeaderProps>;

  /**
   * Id of message, around which Channel/MessageList gets loaded when opened.
   * You will see a highlighted background for targetted message, when opened.
   */
  targetedMessage?: string;
  threadList?: boolean;
  watcherCount?: ChannelState['watcher_count'];
  /**
   *
   * ```json
   * {
   *   "thierry-123": {
   *     "id": "thierry-123",
   *     "role": "user",
   *     "created_at": "2019-04-03T14:42:47.087869Z",
   *     "updated_at": "2019-04-16T09:20:03.982283Z",
   *     "last_active": "2019-04-16T11:23:51.168113408+02:00",
   *     "online": true
   *   },
   *   "vishal-123": {
   *     "id": "vishal-123",
   *     "role": "user",
   *     "created_at": "2019-05-03T14:42:47.087869Z",
   *     "updated_at": "2019-05-16T09:20:03.982283Z",
   *     "last_active": "2019-06-16T11:23:51.168113408+02:00",
   *     "online": false
   *   }
   * }
   * ```
   */
  watchers?: ChannelState['watchers'];
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
