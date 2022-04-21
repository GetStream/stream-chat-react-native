import React, { PropsWithChildren, useContext } from 'react';

import type { Attachment } from 'stream-chat';

import { useResettableState } from './hooks/useResettableState';

import type { GroupType, MessageType } from '../../components/MessageList/hooks/useMessageList';
import type { MessageActionListProps } from '../../components/MessageOverlay/MessageActionList';
import type {
  MessageActionListItemProps,
  MessageActionType,
} from '../../components/MessageOverlay/MessageActionListItem';
import type { OverlayReactionListProps } from '../../components/MessageOverlay/OverlayReactionList';
import type { OverlayReactionsProps } from '../../components/MessageOverlay/OverlayReactions';
import type { OverlayReactionsAvatarProps } from '../../components/MessageOverlay/OverlayReactionsAvatar';
import type { DefaultStreamChatGenerics, UnknownType } from '../../types/types';
import type { ReactionData } from '../../utils/utils';
import type { Alignment, MessageContextValue } from '../messageContext/MessageContext';
import type { MessagesContextValue } from '../messagesContext/MessagesContext';
import type { OwnCapabilitiesContextValue } from '../ownCapabilitiesContext/OwnCapabilitiesContext';
import { getDisplayName } from '../utils/getDisplayName';

export type MessageOverlayData<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  alignment?: Alignment;
  clientId?: string;
  files?: Attachment<StreamChatGenerics>[];
  groupStyles?: GroupType[];
  handleReaction?: (reactionType: string) => Promise<void>;
  images?: Attachment<StreamChatGenerics>[];
  message?: MessageType<StreamChatGenerics>;
  messageActions?: MessageActionType[];
  messageContext?: MessageContextValue<StreamChatGenerics>;
  messageReactionTitle?: string;
  messagesContext?: MessagesContextValue<StreamChatGenerics>;
  onlyEmojis?: boolean;
  otherAttachments?: Attachment<StreamChatGenerics>[];
  OverlayReactionList?: React.ComponentType<OverlayReactionListProps<StreamChatGenerics>>;
  ownCapabilities?: OwnCapabilitiesContextValue;
  supportedReactions?: ReactionData[];
  threadList?: boolean;
};

export type MessageOverlayContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  /**
   * Custom UI component for rendering [message actions](https://github.com/GetStream/stream-chat-react-native/blob/master/screenshots/docs/2.png) in overlay.
   *
   * **Default** [MessageActionList](https://github.com/GetStream/stream-chat-react-native/blob/master/package/src/components/MessageOverlay/MessageActions.tsx)
   */
  MessageActionList: React.ComponentType<MessageActionListProps<StreamChatGenerics>>;
  MessageActionListItem: React.ComponentType<MessageActionListItemProps<StreamChatGenerics>>;
  /**
   * Custom UI component for rendering [reaction selector](https://github.com/GetStream/stream-chat-react-native/blob/master/screenshots/docs/2.png) in overlay (which shows up on long press on message).
   *
   * **Default** [OverlayReactionList](https://github.com/GetStream/stream-chat-react-native/blob/master/package/src/components/MessageOverlay/OverlayReactionList.tsx)
   */
  OverlayReactionList: React.ComponentType<OverlayReactionListProps<StreamChatGenerics>>;
  /**
   * Custom UI component for rendering [reactions list](https://github.com/GetStream/stream-chat-react-native/blob/master/screenshots/docs/2.png), in overlay (which shows up on long press on message).
   *
   * **Default** [OverlayReactions](https://github.com/GetStream/stream-chat-react-native/blob/master/package/src/components/MessageOverlay/OverlayReactions.tsx)
   */
  OverlayReactions: React.ComponentType<OverlayReactionsProps<StreamChatGenerics>>;
  OverlayReactionsAvatar: React.ComponentType<OverlayReactionsAvatarProps>;
  reset: () => void;
  setData: React.Dispatch<React.SetStateAction<MessageOverlayData<StreamChatGenerics>>>;
  data?: MessageOverlayData<StreamChatGenerics>;
};

export const MessageOverlayContext = React.createContext({} as MessageOverlayContextValue);

export const MessageOverlayProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
  value,
}: PropsWithChildren<{
  value?: MessageOverlayContextValue<StreamChatGenerics>;
}>) => {
  const messageOverlayContext = useResettableState(value);
  return (
    <MessageOverlayContext.Provider value={messageOverlayContext as MessageOverlayContextValue}>
      {children}
    </MessageOverlayContext.Provider>
  );
};

export const useMessageOverlayContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() =>
  useContext(MessageOverlayContext) as unknown as MessageOverlayContextValue<StreamChatGenerics>;

/**
 * Typescript currently does not support partial inference so if MessageOverlayContext
 * typing is desired while using the HOC withMessageOverlayContextContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withMessageOverlayContext = <
  P extends UnknownType,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof MessageOverlayContextValue<StreamChatGenerics>>> => {
  const WithMessageOverlayContextComponent = (
    props: Omit<P, keyof MessageOverlayContextValue<StreamChatGenerics>>,
  ) => {
    const messageContext = useMessageOverlayContext<StreamChatGenerics>();

    return <Component {...(props as P)} {...messageContext} />;
  };
  WithMessageOverlayContextComponent.displayName = `WithMessageOverlayContext${getDisplayName(
    Component,
  )}`;
  return WithMessageOverlayContextComponent;
};
