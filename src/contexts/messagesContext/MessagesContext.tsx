import React, { PropsWithChildren, useContext } from 'react';

import type { DebouncedFunc } from 'lodash';
import type {
  ChannelState,
  MessageResponse,
  StreamChat,
  Message as StreamMessage,
  UnknownType,
  UserResponse,
} from 'stream-chat';

import { getDisplayName } from '../utils/getDisplayName';

import type { AttachmentProps } from '../../components/Attachment/Attachment';
import type { MessageSimpleProps } from '../../components/Message/MessageSimple/MessageSimple';
import type { Message } from '../../components/MessageList/utils/insertDates';

import type { SuggestionCommand } from '../suggestionsContext/SuggestionsContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type Alignment = 'right' | 'left';

export type GroupType = 'bottom' | 'middle' | 'single' | 'top';

export type MessageWithDates<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = MessageResponse<At, Ch, Co, Me, Re, Us> & {
  groupStyles: GroupType[];
  readBy: UserResponse<Us>[];
};

export const isEditingBoolean = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  editing: MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>['editing'],
): editing is boolean => typeof editing === 'boolean';

export type MessagesContextValue<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  Attachment: React.ComponentType<AttachmentProps<At>>;
  clearEditingState: () => void;
  editing: boolean | Message<At, Ch, Co, Ev, Me, Re, Us>;
  editMessage: (
    updatedMessage: StreamMessage<At, Me, Us>,
  ) => ReturnType<StreamChat<At, Ch, Co, Ev, Me, Re, Us>['updateMessage']>;
  emojiData: Array<{
    icon: string;
    id: string;
  }>;
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: DebouncedFunc<() => Promise<void>>;
  Message: React.ComponentType<MessageSimpleProps<At, Ch, Co, Ev, Me, Re, Us>>;
  messages: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messages'];
  removeMessage: (message: { id: string; parent_id?: string }) => void;
  retrySendMessage: (
    message: MessageResponse<At, Ch, Co, Me, Re, Us>,
  ) => Promise<void>;
  sendMessage: (message: {
    attachments?: StreamMessage<At, Me, Us>['attachments'];
    extraFields?: Partial<StreamMessage<At, Me, Us>>;
    mentioned_users?: StreamMessage<At, Me, Us>['mentioned_users'];
    parent?: StreamMessage<At, Me, Us>['parent_id'];
    text?: StreamMessage<At, Me, Us>['text'];
  }) => Promise<void>;
  setEditingState: (message: Message<At, Ch, Co, Ev, Me, Re, Us>) => void;
  updateMessage: (
    updatedMessage: MessageResponse<At, Ch, Co, Me, Re, Us>,
    extraState?: {
      commands?: SuggestionCommand<Co>[];
      messageInput?: string;
      threadMessages?: ChannelState<
        At,
        Ch,
        Co,
        Ev,
        Me,
        Re,
        Us
      >['threads'][string];
    },
  ) => void;
};

export const MessagesContext = React.createContext({} as MessagesContextValue);

export const MessagesProvider = <
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
  value: MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <MessagesContext.Provider value={(value as unknown) as MessagesContextValue}>
    {children}
  </MessagesContext.Provider>
);

export const useMessagesContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>() =>
  (useContext(MessagesContext) as unknown) as MessagesContextValue<
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
export const withMessagesContext = <
  P extends Record<string, unknown>,
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
  Omit<P, keyof MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>>
> => {
  const WithMessagesContextComponent = (
    props: Omit<P, keyof MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const messagesContext = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...messagesContext} />;
  };
  WithMessagesContextComponent.displayName = `WithMessagesContext${getDisplayName(
    Component,
  )}`;
  return WithMessagesContextComponent;
};
