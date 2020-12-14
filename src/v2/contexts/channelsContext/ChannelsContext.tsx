import React, { PropsWithChildren, useContext } from 'react';

import { getDisplayName } from '../utils/getDisplayName';

import type { FlatListProps } from 'react-native';
import type { FlatList } from 'react-native-gesture-handler';
import type { Channel } from 'stream-chat';

import type { HeaderErrorProps } from '../../components/ChannelList/ChannelListHeaderErrorIndicator';
import type { ChannelPreviewMessengerProps } from '../../components/ChannelPreview/ChannelPreviewMessenger';
import type { EmptyStateProps } from '../../components/Indicators/EmptyStateIndicator';
import type { LoadingErrorProps } from '../../components/Indicators/LoadingErrorIndicator';
import type { LoadingProps } from '../../components/Indicators/LoadingIndicator';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

export type ChannelsContextValue<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /**
   * Besides the existing default behavior of the ChannelListMessenger component, you can attach
   * additional props to the underlying React Native FlatList.
   *
   * You can find list of all the available FlatList props here - https://facebook.github.io/react-native/docs/flatlist#props
   *
   * **EXAMPLE:**
   *
   * ```
   * <ChannelListMessenger
   *  channels={channels}
   *  additionalFlatListProps={{ bounces: true }}
   * />
   * ```
   *
   * **Note:** Don't use `additionalFlatListProps` to access the FlatList ref, use `setFlatListRef`
   */
  additionalFlatListProps: Partial<
    FlatListProps<Channel<At, Ch, Co, Ev, Me, Re, Us>>
  >;
  /**
   * Channels can be either an array of channels or a promise which resolves to an array of channels
   */
  channels: Channel<At, Ch, Co, Ev, Me, Re, Us>[];
  /**
   * Custom indicator to use when channel list is empty
   *
   * Default: [EmptyStateIndicator](https://getstream.github.io/stream-chat-react-native/#emptystateindicator)
   * */
  EmptyStateIndicator: React.ComponentType<EmptyStateProps>;
  /**
   * Error in channels query, if any
   */
  error: boolean;
  /**
   * Custom loading indicator to display at bottom of the list, while loading further pages
   *
   * Default: [ChannelListFooterLoadingIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListFooterLoadingIndicator)
   */
  FooterLoadingIndicator: React.ComponentType;
  /**
   * Incremental number change to force update the FlatList
   */
  forceUpdate: number;
  /**
   * Whether or not the FlatList has another page to render
   */
  hasNextPage: boolean;
  /**
   * Custom indicator to display error at top of list, if loading/pagination error occurs
   *
   * Default: [ChannelListHeaderErrorIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListHeaderErrorIndicator)
   */
  HeaderErrorIndicator: React.ComponentType<HeaderErrorProps>;
  /**
   * Custom indicator to display network-down error at top of list, if there is connectivity issue
   *
   * Default: [ChannelListHeaderNetworkDownIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListHeaderNetworkDownIndicator)
   */
  HeaderNetworkDownIndicator: React.ComponentType;
  /**
   * Initial channels query loading state, triggers the LoadingIndicator
   */
  loadingChannels: boolean;
  /**
   * Custom indicator to use when there is error in fetching channels
   *
   * Default: [LoadingErrorIndicator](https://getstream.github.io/stream-chat-react-native/#loadingerrorindicator)
   * */
  LoadingErrorIndicator: React.ComponentType<LoadingErrorProps>;
  /**
   * Custom loading indicator to use
   *
   * Default: [LoadingIndicator](https://getstream.github.io/stream-chat-react-native/#loadingindicator)
   * */
  LoadingIndicator: React.ComponentType<LoadingProps>;
  /**
   * Whether or not additional channels are being loaded, triggers the FooterLoadingIndicator
   */
  loadingNextPage: boolean;
  /**
   * The React Native FlatList threshold to fetch more data
   * @see See loadMoreThreshold [doc](https://facebook.github.io/react-native/docs/flatlist#onendreachedthreshold)
   * */
  loadMoreThreshold: number;
  /**
   * Loads the next page of `channels`, which is present as a required prop
   */
  loadNextPage:
    | ((queryType?: string, retryCount?: number) => Promise<void>)
    | undefined;
  /**
   * Number of skeletons that should show when loading. Default: 6
   */
  numberOfSkeletons: number;
  /**
   * Custom UI component to display individual channel list items
   *
   * Default: [ChannelPreviewMessenger](https://getstream.github.io/stream-chat-react-native/#channelpreviewmessenger)
   */
  Preview: React.ComponentType<
    ChannelPreviewMessengerProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /**
   * Triggered when the channel list is refreshing, displays a loading spinner at the top of the list
   */
  refreshing: boolean;
  /**
   * Function to refresh the channel list that is similar to `reloadList`, but it doesn't wipe out existing channels
   * from UI before loading the new ones
   */
  refreshList: () => void | Promise<void>;
  /**
   * Removes all the existing channels from UI and loads fresh channels
   * */
  reloadList: () => Promise<void>;
  // /**
  //  * Function to set the currently active channel, acts as a bridge between ChannelList and Channel components
  //  *
  //  * @param channel A channel object
  //  */
  // setActiveChannel?: (channel: Channel<At, Ch, Co, Ev, Me, Re, Us>) => void;
  /**
   * Function to gain access to the inner FlatList ref
   *
   * **Example:**
   *
   * ```
   * <ChannelListMessenger
   *  setFlatListRef={(ref) => {
   *    // Use ref for your own good
   *  }}
   * ```
   */
  setFlatListRef: (
    ref: FlatList<Channel<At, Ch, Co, Ev, Me, Re, Us>> | null,
  ) => void;
  /**
   * Custom UI component to display loading channel skeletons
   *
   * Default: [Skeleton](https://getstream.github.io/stream-chat-react-native/#skeleton)
   */
  Skeleton: React.ComponentType;
  /**
   * Function to set the currently active channel, acts as a bridge between ChannelList and Channel components
   *
   * @param channel A channel object
   */
  onSelect?: (channel: Channel<At, Ch, Co, Ev, Me, Re, Us>) => void;
};

export const ChannelsContext = React.createContext({} as ChannelsContextValue);

// const areEqual = <
//   At extends UnknownType = DefaultAttachmentType,
//   Ch extends UnknownType = DefaultChannelType,
//   Co extends string = DefaultCommandType,
//   Ev extends UnknownType = DefaultEventType,
//   Me extends UnknownType = DefaultMessageType,
//   Re extends UnknownType = DefaultReactionType,
//   Us extends UnknownType = DefaultUserType
// >(
//   prevProps: {
//     value: ChannelsContextValue<At, Ch, Co, Ev, Me, Re, Us>;
//   },
//   nextProps: {
//     value: ChannelsContextValue<At, Ch, Co, Ev, Me, Re, Us>;
//   },
// ) => {
//   const {
//     value: {
//       channels: prevChannels,
//       error: prevError,
//       forceUpdate: prevForceUpdate,
//       hasNextPage: prevHasNextPage,
//       loadingChannels: prevLoadingChannels,
//       loadingNextPage: prevLoadingNextPage,
//       refreshing: prevRefreshing,
//     },
//   } = prevProps;
//   const {
//     value: {
//       channels: nextChannels,
//       error: nextError,
//       forceUpdate: nextForceUpdate,
//       hasNextPage: nextHasNextPage,
//       loadingChannels: nextLoadingChannels,
//       loadingNextPage: nextLoadingNextPage,
//       refreshing: nextRefreshing,
//     },
//   } = nextProps;

//   const refreshingEqual = prevRefreshing === nextRefreshing;
//   if (!refreshingEqual) return false;

//   const loadingChannelsEqual = prevLoadingChannels === nextLoadingChannels;
//   if (!loadingChannelsEqual) return false;

//   const loadingNextPageEqual = prevLoadingNextPage === nextLoadingNextPage;
//   if (!loadingNextPageEqual) return false;

//   const forceUpdateEqual = prevForceUpdate === nextForceUpdate;
//   if (!forceUpdateEqual) return false;

//   const hasNextPageEqual = prevHasNextPage === nextHasNextPage;
//   if (!hasNextPageEqual) return false;

//   const errorEqual = prevError === nextError;
//   if (!errorEqual) return false;

//   const channelsEqual =
//     prevChannels.length === nextChannels.length &&
//     prevChannels.every(
//       (channel, index) =>
//         channel.data?.name === nextChannels[index].data?.name &&
//         Object.keys(channel.state.members).every(
//           (memberId) =>
//             nextChannels[index].state.members[memberId].user?.online ===
//             channel.state.members[memberId].user?.online,
//         ),
//     );
//   if (!channelsEqual) return false;

//   return true;
// };

// const ChannelsProviderMemoized = React.memo(
//   ChannelsContext.Provider,
//   areEqual,
// ) as typeof ChannelsContext.Provider;

export const ChannelsProvider = <
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
  value: ChannelsContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <ChannelsContext.Provider value={(value as unknown) as ChannelsContextValue}>
    {children}
  </ChannelsContext.Provider>
);

export const useChannelsContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>() =>
  (useContext(ChannelsContext) as unknown) as ChannelsContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >;

/**
 * Typescript currently does not support partial inference so if ChatContext
 * typing is desired while using the HOC withChannelContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChannelsContext = <
  P extends UnknownType,
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  Component: React.ComponentType<P>,
): React.FC<
  Omit<P, keyof ChannelsContextValue<At, Ch, Co, Ev, Me, Re, Us>>
> => {
  const WithChannelsContextComponent = (
    props: Omit<P, keyof ChannelsContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const channelsContext = useChannelsContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...channelsContext} />;
  };
  WithChannelsContextComponent.displayName = `WithChannelsContext${getDisplayName(
    Component,
  )}`;
  return WithChannelsContextComponent;
};
