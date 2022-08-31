import React, { PropsWithChildren, useContext } from 'react';

import type { ImageProps } from 'react-native';

import type { Attachment, TranslationLanguages } from 'stream-chat';

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
import type { ChatContextValue } from '../chatContext/ChatContext';
import type { Alignment, MessageContextValue } from '../messageContext/MessageContext';
import type { MessagesContextValue } from '../messagesContext/MessagesContext';
import type { OwnCapabilitiesContextValue } from '../ownCapabilitiesContext/OwnCapabilitiesContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { getDisplayName } from '../utils/getDisplayName';
import { isTestEnvironment } from '../utils/isTestEnvironment';

export type MessageOverlayData<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  alignment?: Alignment;
  chatContext?: ChatContextValue<StreamChatGenerics>;
  clientId?: string;
  files?: Attachment<StreamChatGenerics>[];
  groupStyles?: GroupType[];
  handleReaction?: (reactionType: string) => Promise<void>;
  ImageComponent?: React.ComponentType<ImageProps>;
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
  userLanguage?: TranslationLanguages;
  videos?: Attachment<StreamChatGenerics>[];
};

export type MessageOverlayContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  /**
   * Custom UI component for rendering [message actions](https://github.com/GetStream/stream-chat-react-native/blob/main/screenshots/docs/2.png) in overlay.
   *
   * **Default** [MessageActionList](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageOverlay/MessageActions.tsx)
   */
  MessageActionList: React.ComponentType<MessageActionListProps<StreamChatGenerics>>;
  MessageActionListItem: React.ComponentType<MessageActionListItemProps<StreamChatGenerics>>;
  /**
   * Custom UI component for rendering [reaction selector](https://github.com/GetStream/stream-chat-react-native/blob/main/screenshots/docs/2.png) in overlay (which shows up on long press on message).
   *
   * **Default** [OverlayReactionList](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageOverlay/OverlayReactionList.tsx)
   */
  OverlayReactionList: React.ComponentType<OverlayReactionListProps<StreamChatGenerics>>;
  /**
   * Custom UI component for rendering [reactions list](https://github.com/GetStream/stream-chat-react-native/blob/main/screenshots/docs/2.png), in overlay (which shows up on long press on message).
   *
   * **Default** [OverlayReactions](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageOverlay/OverlayReactions.tsx)
   */
  OverlayReactions: React.ComponentType<OverlayReactionsProps<StreamChatGenerics>>;
  OverlayReactionsAvatar: React.ComponentType<OverlayReactionsAvatarProps>;
  reset: () => void;
  setData: React.Dispatch<React.SetStateAction<MessageOverlayData<StreamChatGenerics>>>;
  data?: MessageOverlayData<StreamChatGenerics>;
};

export const MessageOverlayContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as MessageOverlayContextValue,
);

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
    <MessageOverlayContext.Provider
      value={messageOverlayContext as unknown as MessageOverlayContextValue}
    >
      {children}
    </MessageOverlayContext.Provider>
  );
};

export const useMessageOverlayContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  const contextValue = useContext(
    MessageOverlayContext,
  ) as unknown as MessageOverlayContextValue<StreamChatGenerics>;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      `The useMessageOverlayContext hook was called outside the MessageOverlayContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider`,
    );
  }

  return contextValue;
};

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
