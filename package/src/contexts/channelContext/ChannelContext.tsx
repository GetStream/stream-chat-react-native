import React, { PropsWithChildren, useContext } from 'react';

import type { Channel, ChannelState } from 'stream-chat';

import type { EmptyStateProps } from '../../components/Indicators/EmptyStateIndicator';
import type { LoadingProps } from '../../components/Indicators/LoadingIndicator';
import type { DefaultStreamChatGenerics, UnknownType } from '../../types/types';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { getDisplayName } from '../utils/getDisplayName';
import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ChannelContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
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
  channel: Channel<StreamChatGenerics>;
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
   * When set to false, it will disable giphy command on MessageInput component.
   */
  giphyEnabled: boolean;
  /**
   * Hide inline date separators on channel
   */
  hideDateSeparators: boolean;
  hideStickyDateHeader: boolean;
  /**
   * Returns true if the current user has admin privileges
   */
  isAdmin: boolean;
  /**
   * Returns true if the current user is a moderator
   */
  isModerator: boolean;
  /**
   * Returns true if the current user is a owner
   */
  isOwner: boolean;
  /**
   * Loads channel around a specific message
   *
   * @param messageId If undefined, channel will be loaded at most recent message.
   */
  loadChannelAroundMessage: ({ messageId }: { messageId?: string }) => Promise<void>;
  /**
   * @deprecated use loadChannelAroundMessage instead
   *
   * Loads channel at specific message
   *
   * @param messageId If undefined, channel will be loaded at most recent message.
   * @param before Number of message to query before messageId
   * @param after Number of message to query after messageId
   */
  loadChannelAtMessage: ({
    after,
    before,
    messageId,
  }: {
    after?: number;
    before?: number;
    messageId?: string;
  }) => Promise<void>;
  loading: boolean;
  /**
   * Custom loading indicator to override the Stream default
   */
  LoadingIndicator: React.ComponentType<LoadingProps>;
  markRead: () => void;
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
  members: ChannelState<StreamChatGenerics>['members'];
  /**
   * Custom network down indicator to override the Stream default
   */
  NetworkDownIndicator: React.ComponentType;
  read: ChannelState<StreamChatGenerics>['read'];
  reloadChannel: () => Promise<void>;
  /**
   * When true, messagelist will be scrolled to first unread message, when opened.
   */
  scrollToFirstUnreadThreshold: number;
  setLastRead: React.Dispatch<React.SetStateAction<Date | undefined>>;
  setTargetedMessage: (messageId: string) => void;
  /**
   * Abort controller for cancelling async requests made for uploading images/files
   * Its a map of filename and AbortController
   */
  uploadAbortControllerRef: React.MutableRefObject<Map<string, AbortController>>;
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
  watchers: ChannelState<StreamChatGenerics>['watchers'];
  disabled?: boolean;
  enableMessageGroupingByUser?: boolean;
  isChannelActive?: boolean;
  lastRead?: Date;
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
  StickyHeader?: React.ComponentType<{ dateString: string }>;
  /**
   * Id of message, around which Channel/MessageList gets loaded when opened.
   * You will see a highlighted background for targetted message, when opened.
   */
  targetedMessage?: string;
  threadList?: boolean;
  watcherCount?: ChannelState<StreamChatGenerics>['watcher_count'];
};

export const ChannelContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelContextValue,
);

export const ChannelProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
  value,
}: PropsWithChildren<{
  value: ChannelContextValue<StreamChatGenerics>;
}>) => (
  <ChannelContext.Provider value={value as unknown as ChannelContextValue}>
    {children}
  </ChannelContext.Provider>
);

export const useChannelContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  const contextValue = useContext(
    ChannelContext,
  ) as unknown as ChannelContextValue<StreamChatGenerics>;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      `The useChannelContext hook was called outside of the ChannelContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel`,
    );
  }

  return contextValue;
};

/**
 * @deprecated
 *
 * This will be removed in the next major version.
 *
 * Typescript currently does not support partial inference so if ChatContext
 * typing is desired while using the HOC withChannelContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChannelContext = <
  P extends UnknownType,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<P>,
): React.ComponentType<Omit<P, keyof ChannelContextValue<StreamChatGenerics>>> => {
  const WithChannelContextComponent = (
    props: Omit<P, keyof ChannelContextValue<StreamChatGenerics>>,
  ) => {
    const channelContext = useChannelContext<StreamChatGenerics>();

    return <Component {...(props as P)} {...channelContext} />;
  };
  WithChannelContextComponent.displayName = `WithChannelContext${getDisplayName(Component)}`;
  return WithChannelContextComponent;
};
