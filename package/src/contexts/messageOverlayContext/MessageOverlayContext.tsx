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
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  alignment?: Alignment;
  clientId?: string;
  files?: Attachment<StreamChatClient>[];
  groupStyles?: GroupType[];
  handleReaction?: (reactionType: string) => Promise<void>;
  images?: Attachment<StreamChatClient>[];
  message?: MessageType<StreamChatClient>;
  messageActions?: MessageActionType[];
  messageContext?: MessageContextValue<StreamChatClient>;
  messageReactionTitle?: string;
  messagesContext?: MessagesContextValue<StreamChatClient>;
  onlyEmojis?: boolean;
  otherAttachments?: Attachment<StreamChatClient>[];
  OverlayReactionList?: React.ComponentType<OverlayReactionListProps<StreamChatClient>>;
  ownCapabilities?: OwnCapabilitiesContextValue;
  supportedReactions?: ReactionData[];
  threadList?: boolean;
};

export type MessageOverlayContextValue<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  /**
   * Custom UI component for rendering [message actions](https://github.com/GetStream/stream-chat-react-native/blob/master/screenshots/docs/2.png) in overlay.
   *
   * **Default** [MessageActionList](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageOverlay/MessageActions.tsx)
   */
  MessageActionList: React.ComponentType<MessageActionListProps<StreamChatClient>>;
  MessageActionListItem: React.ComponentType<MessageActionListItemProps<StreamChatClient>>;
  /**
   * Custom UI component for rendering [reaction selector](https://github.com/GetStream/stream-chat-react-native/blob/master/screenshots/docs/2.png) in overlay (which shows up on long press on message).
   *
   * **Default** [OverlayReactionList](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageOverlay/OverlayReactionList.tsx)
   */
  OverlayReactionList: React.ComponentType<OverlayReactionListProps<StreamChatClient>>;
  /**
   * Custom UI component for rendering [reactions list](https://github.com/GetStream/stream-chat-react-native/blob/master/screenshots/docs/2.png), in overlay (which shows up on long press on message).
   *
   * **Default** [OverlayReactions](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageOverlay/OverlayReactions.tsx)
   */
  OverlayReactions: React.ComponentType<OverlayReactionsProps<StreamChatClient>>;
  OverlayReactionsAvatar: React.ComponentType<OverlayReactionsAvatarProps>;
  reset: () => void;
  setData: React.Dispatch<React.SetStateAction<MessageOverlayData<StreamChatClient>>>;
  data?: MessageOverlayData<StreamChatClient>;
};

export const MessageOverlayContext = React.createContext({} as MessageOverlayContextValue);

export const MessageOverlayProvider = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
  value,
}: PropsWithChildren<{
  value?: MessageOverlayContextValue<StreamChatClient>;
}>) => {
  const messageOverlayContext = useResettableState(value);
  return (
    <MessageOverlayContext.Provider value={messageOverlayContext as MessageOverlayContextValue}>
      {children}
    </MessageOverlayContext.Provider>
  );
};

export const useMessageOverlayContext = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => useContext(MessageOverlayContext) as unknown as MessageOverlayContextValue<StreamChatClient>;

/**
 * Typescript currently does not support partial inference so if MessageOverlayContext
 * typing is desired while using the HOC withMessageOverlayContextContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withMessageOverlayContext = <
  P extends UnknownType,
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof MessageOverlayContextValue<StreamChatClient>>> => {
  const WithMessageOverlayContextComponent = (
    props: Omit<P, keyof MessageOverlayContextValue<StreamChatClient>>,
  ) => {
    const messageContext = useMessageOverlayContext<StreamChatClient>();

    return <Component {...(props as P)} {...messageContext} />;
  };
  WithMessageOverlayContextComponent.displayName = `WithMessageOverlayContext${getDisplayName(
    Component,
  )}`;
  return WithMessageOverlayContextComponent;
};
