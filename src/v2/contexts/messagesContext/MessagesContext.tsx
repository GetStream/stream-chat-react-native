import React, { PropsWithChildren, useContext } from 'react';

import { getDisplayName } from '../utils/getDisplayName';

import type { TouchableOpacityProps } from 'react-native';
import type { DebouncedFunc } from 'lodash';
import type {
  ChannelState,
  MessageResponse,
  StreamChat,
  Message as StreamMessage,
} from 'stream-chat';

import type { SuggestionCommand } from '../suggestionsContext/SuggestionsContext';
import type { AttachmentProps } from '../../components/Attachment/Attachment';
import type { AttachmentActionsProps } from '../../components/Attachment/AttachmentActions';
import type { CardProps } from '../../components/Attachment/Card';
import type { FileAttachmentProps } from '../../components/Attachment/FileAttachment';
import type { FileAttachmentGroupProps } from '../../components/Attachment/FileAttachmentGroup';
import type { FileIconProps } from '../../components/Attachment/FileIcon';
import type { GalleryProps } from '../../components/Attachment/Gallery';
import type { MessageProps } from '../../components/Message/Message';
import type { MessageAvatarProps } from '../../components/Message/MessageSimple/MessageAvatar';
import type { MessageContentProps } from '../../components/Message/MessageSimple/MessageContent';
import type { MessageRepliesProps } from '../../components/Message/MessageSimple/MessageReplies';
import type { MessageStatusProps } from '../../components/Message/MessageSimple/MessageStatus';
import type { MessageSimpleProps } from '../../components/Message/MessageSimple/MessageSimple';
import type { MessageTextProps } from '../../components/Message/MessageSimple/MessageTextContainer';
import type { MarkdownRules } from '../../components/Message/MessageSimple/utils/renderText';
import type { Message } from '../../components/MessageList/utils/insertDates';
import type { ReactionListProps } from '../../components/Message/MessageSimple/ReactionList';
import type { TDateTimeParserInput } from '../../contexts/translationContext/TranslationContext';
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
import type { ReactionData } from '../../utils/utils';

export type ActionProps = {
  reactionsEnabled?: boolean;
  repliesEnabled?: boolean;
};

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
  readBy: boolean | number;
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
> = ActionProps & {
  /**
   * Custom UI component for attachment.
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/Attachment.tsx
   */
  Attachment: React.ComponentType<AttachmentProps<At>>;
  /**
   * Custom UI component to display attachment actions. e.g., send, shuffle, cancel in case of giphy
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/AttachmentActions.tsx
   */
  AttachmentActions: React.ComponentType<AttachmentActionsProps<At>>;
  /**
   * Custom UI component for attachment icon for type 'file' attachment.
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/FileIcon.tsx
   */
  AttachmentFileIcon: React.ComponentType<FileIconProps>;
  /**
   * Custom UI component to display generic media type e.g. giphy, url preview etc
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/Card.tsx
   */
  Card: React.ComponentType<CardProps<At>>;
  clearEditingState: () => void;
  /** Should keyboard be dismissed when messaged is touched */
  dismissKeyboardOnMessageTouch: boolean;
  editing: boolean | Message<At, Ch, Co, Ev, Me, Re, Us>;
  editMessage: StreamChat<At, Ch, Co, Ev, Me, Re, Us>['updateMessage'];
  /**
   * Custom UI component to display File type attachment.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/FileAttachment.tsx
   */
  FileAttachment: React.ComponentType<FileAttachmentProps<At>>;
  /**
   * Custom UI component to display group of File type attachments or multiple file attachments (in single message).
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/FileAttachmentGroup.tsx
   */
  FileAttachmentGroup: React.ComponentType<FileAttachmentGroupProps<At>>;
  /**
   * Custom UI component to display image attachments.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/Gallery.tsx
   */
  Gallery: React.ComponentType<GalleryProps<At>>;
  /**
   * Custom UI component to display Giphy image.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/Card.tsx
   */
  Giphy: React.ComponentType<CardProps<At>>;
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: DebouncedFunc<() => Promise<void>>;
  Message: React.ComponentType<MessageProps>;
  /**
   * Custom UI component for the avatar next to a message
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Message/MessageSimple/MessageAvatar.tsx
   **/
  MessageAvatar: React.ComponentType<MessageAvatarProps>;
  /**
   * Custom UI component for message content
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Message/MessageSimple/MessageContent.tsx
   */
  MessageContent: React.ComponentType<
    MessageContentProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /**
   * Custom message replies component
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageSimple/MessageReplies.tsx
   */
  MessageReplies: React.ComponentType<
    MessageRepliesProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  messages: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messages'];
  /**
   * Custom UI component for MessageSimple
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Message/MessageSimple/MessageSimple.tsx
   */
  MessageSimple: React.ComponentType<
    MessageSimpleProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /**
   * Custom UI component for message status (delivered/read)
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Message/MessageSimple/MessageStatus.tsx
   */
  MessageStatus: React.ComponentType<
    MessageStatusProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /**
   * Custom UI component to display reaction list.
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Reaction/ReactionList.tsx
   */
  ReactionList: React.ComponentType<ReactionListProps>;
  removeMessage: (message: {
    id: string;
    parent_id?: StreamMessage<At, Me, Us>['parent_id'];
  }) => void;
  retrySendMessage: (
    message: MessageResponse<At, Ch, Co, Me, Re, Us>,
  ) => Promise<void>;
  sendMessage: (message: Partial<StreamMessage<At, Me, Us>>) => Promise<void>;
  setEditingState: (message: Message<At, Ch, Co, Ev, Me, Re, Us>) => void;
  supportedReactions: ReactionData[];
  /** Whether message text should be rendered before attachments */
  textBeforeAttachments: boolean;
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
  /**
   * Custom UI component to display enriched url preview.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/Card.tsx
   */
  UrlPreview: React.ComponentType<CardProps<At, Ch, Co, Ev, Me, Re, Us>>;
  /**
   * Provide any additional props for `TouchableOpacity` which wraps inner MessageContent component here.
   * Please check docs for TouchableOpacity for supported props - https://reactnative.dev/docs/touchableopacity#props
   */
  additionalTouchableProps?: Omit<TouchableOpacityProps, 'style'>;
  /**
   * Custom UI component to override default cover (between Header and Footer) of Card component.
   * Accepts the same props as Card component.
   */
  CardCover?: React.ComponentType<CardProps<At, Ch, Co, Ev, Me, Re, Us>>;
  /**
   * Custom UI component to override default Footer of Card component.
   * Accepts the same props as Card component.
   */
  CardFooter?: React.ComponentType<CardProps<At, Ch, Co, Ev, Me, Re, Us>>;
  /**
   * Custom UI component to override default header of Card component.
   * Accepts the same props as Card component.
   */
  CardHeader?: React.ComponentType<CardProps<At, Ch, Co, Ev, Me, Re, Us>>;
  /**
   * Optional function to custom format the message date
   */
  formatDate?: (date: TDateTimeParserInput) => string;
  /** Object specifying rules defined within simple-markdown https://github.com/Khan/simple-markdown#adding-a-simple-extension */
  markdownRules?: MarkdownRules;
  /**
   * Custom message footer component
   */
  MessageFooter?: React.ComponentType<UnknownType & { testID: string }>;
  /**
   * Custom message header component
   */
  MessageHeader?: React.ComponentType<UnknownType & { testID: string }>;
  /** Custom UI component for message text */
  MessageText?: React.ComponentType<
    MessageTextProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
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
