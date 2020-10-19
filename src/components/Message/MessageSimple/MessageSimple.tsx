import React from 'react';

import { MessageAvatar as DefaultMessageAvatar } from './MessageAvatar';
import {
  MessageContent as DefaultMessageContent,
  ForwardedMessageProps,
} from './MessageContent';
import { MessageStatus as DefaultMessageStatus } from './MessageStatus';

import { styled } from '../../../styles/styledComponents';
import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';

import type {
  GestureResponderEvent,
  TouchableOpacityProps,
} from 'react-native';

import type { MessageActionSheetProps } from './MessageActionSheet';
import type { MessageTextProps } from './MessageTextContainer';

import type { ActionProps, MessageProps } from '../Message';

import type { ActionHandler } from '../../Attachment/Attachment';
import type { AttachmentActionsProps } from '../../Attachment/AttachmentActions';
import type { CardProps } from '../../Attachment/Card';
import type { FileAttachmentProps } from '../../Attachment/FileAttachment';
import type { FileAttachmentGroupProps } from '../../Attachment/FileAttachmentGroup';
import type { GalleryProps } from '../../Attachment/Gallery';
import type { ReactionListProps } from '../../Reaction/ReactionList';

import type { Message } from '../../../components/MessageList/utils/insertDates';
import type {
  Alignment,
  GroupType,
  MessagesContextValue,
} from '../../../contexts/messagesContext/MessagesContext';
import type { TDateTimeParserInput } from '../../../contexts/translationContext/TranslationContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

const Container = styled.View<{
  alignment: Alignment;
  hasMarginBottom: boolean;
  isVeryLastMessage: boolean;
}>`
  align-items: flex-end;
  flex-direction: row;
  justify-content: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  margin-bottom: ${({ hasMarginBottom, isVeryLastMessage }) =>
    hasMarginBottom ? (isVeryLastMessage ? 30 : 20) : 0}px;
  ${({ theme }) => theme.message.container.css}
`;

export type MessageSimpleProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = ActionProps &
  MessageProps<At, Ch, Co, Ev, Me, Re, Us> & {
    /**
     * Whether or not user actions are enabled
     */
    actionsEnabled: boolean;
    /**
     * Whether or not to show the action sheet
     */
    actionSheetVisible: boolean;
    /**
     * Function that returns a boolean indicating whether or not the user can delete the message.
     */
    canDeleteMessage: () => boolean | undefined;
    /**
     * Function that returns a boolean indicating whether or not the user can edit the message.
     */
    canEditMessage: () => boolean | undefined;

    /** Dismiss the reaction picker */
    dismissReactionPicker: () => void;
    /**
     * Get the total number of reactions on a message
     */
    getTotalReactionCount: (
      supportedReactions: {
        icon: string;
        id: string;
      }[],
    ) => number;

    /** Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands). */
    handleAction: ActionHandler;
    /**
     * Handler to delete a current message.
     */
    handleDelete: () => Promise<void>;
    /**
     * Handler to edit a current message. This function sets the current message as the `editing` property of channel context.
     * The `editing` prop is used by the MessageInput component to switch to edit mode.
     */
    handleEdit: () => void;
    /** Handler to flag the message */
    handleFlag: () => Promise<void>;
    /** Handler to mute the user */
    handleMute: () => Promise<void>;
    /** Handler to process a reaction */
    handleReaction: (reactionType: string) => Promise<void>;
    /** Handler to resend the message */
    handleRetry: () => Promise<void>;
    /**
     * Returns true if the current user has admin privileges
     */
    isAdmin: () => boolean | undefined;
    /**
     * Returns true if the current user is a moderator
     */
    isModerator: () => boolean | undefined;
    /**
     * Returns true if message belongs to current user, else false
     */
    isMyMessage: (message: Message<At, Ch, Co, Ev, Me, Re, Us>) => boolean;

    /** Opens the reaction picker */
    openReactionPicker: () => Promise<void>;
    /** Whether or not the reaction picker is visible */
    reactionPickerVisible: boolean;
    /**
     * React useState hook setter function that toggles action sheet visibility
     */
    setActionSheetVisible: React.Dispatch<React.SetStateAction<boolean>>;
    /**
     * Opens the action sheet
     */
    showActionSheet: () => Promise<void>;
    /**
     * Custom UI component for the action sheet that appears on long press of a Message.
     * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Message/MessageSimple/MessageActionSheet.tsx
     *
     * Wrap your action sheet component in `React.forwardRef` to gain access to the `actionSheetRef` set in MessageContent.
     */
    ActionSheet?: React.ComponentType<MessageActionSheetProps>;
    /**
     * Provide any additional props for `TouchableOpacity` which wraps inner MessageContent component here.
     * Please check docs for TouchableOpacity for supported props - https://reactnative.dev/docs/touchableopacity#props
     */
    additionalTouchableProps?: Omit<TouchableOpacityProps, 'style'>;
    /**
     * Custom UI component to display attachments on individual messages
     * Default component (accepts the same props): [Attachment](https://getstream.github.io/stream-chat-react-native/#attachment)
     */
    Attachment?: MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>['Attachment'];
    /**
     * Custom UI component to display attachment actions. e.g., send, shuffle, cancel in case of giphy
     * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/AttachmentActions.tsx
     */
    AttachmentActions?: React.ComponentType<AttachmentActionsProps<At>>;
    /**
     * Custom UI component to display generic media type e.g. giphy, url preview etc
     * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/Card.tsx
     */
    Card?: React.ComponentType<CardProps<At>>;
    /**
     * Custom UI component to override default cover (between Header and Footer) of Card component.
     * Accepts the same props as Card component.
     */
    CardCover?: React.ComponentType<CardProps<At>>;
    /**
     * Custom UI component to override default Footer of Card component.
     * Accepts the same props as Card component.
     */
    CardFooter?: React.ComponentType<CardProps<At>>;
    /**
     * Custom UI component to override default header of Card component.
     * Accepts the same props as Card component.
     */
    CardHeader?: React.ComponentType<CardProps<At>>;
    /**
     * Whether or not users are able to long press messages.
     */
    enableLongPress?: boolean;
    /**
     * Custom UI component to display File type attachment.
     * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/FileAttachment.tsx
     */
    FileAttachment?: React.ComponentType<FileAttachmentProps<At>>;
    /**
     * Custom UI component to display group of File type attachments or multiple file attachments (in single message).
     * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/FileAttachmentGroup.tsx
     */
    FileAttachmentGroup?: React.ComponentType<FileAttachmentGroupProps<At>>;
    /**
     * Force alignment of message to left or right - 'left' | 'right'
     * By default, current user's messages will be aligned to right and other user's messages will be aligned to left.
     * */
    forceAlign?: Alignment | boolean;
    /**
     * Optional function to custom format the message date
     */
    formatDate?: (date: TDateTimeParserInput) => string;
    /**
     * Custom UI component to display image attachments.
     * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/Gallery.tsx
     */
    Gallery?: React.ComponentType<GalleryProps<At>>;
    /**
     * Custom UI component to display Giphy image.
     * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/Card.tsx
     */
    Giphy?: React.ComponentType<CardProps<At>>;
    /** enable hiding reaction count from reaction picker  */
    hideReactionCount?: boolean;
    /** enable hiding reaction owners from reaction picker */
    hideReactionOwners?: boolean;
    /** Boolean if current message is part of thread */
    isThreadList?: boolean;
    /** Object specifying rules defined within simple-markdown https://github.com/Khan/simple-markdown#adding-a-simple-extension */
    markdownRules?: UnknownType;
    /**
     * Array of allowed actions on message. e.g. ['edit', 'delete', 'reactions', 'reply']
     * If all the actions need to be disabled, empty array or false should be provided as value of prop.
     * */
    messageActions?: boolean | string[];
    /**
     * Custom UI component for the avatar next to a message
     * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Message/MessageSimple/MessageAvatar.tsx
     * */
    MessageAvatar?: React.ComponentType<
      ForwardedMessageProps<At, Ch, Co, Ev, Me, Re, Us>
    > & { showAvatar?: boolean };
    /**
     * Custom UI component for message content
     * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Message/MessageSimple/MessageContent.tsx
     * */
    MessageContent?: React.ComponentType<
      ForwardedMessageProps<At, Ch, Co, Ev, Me, Re, Us>
    >;
    /**
     * Custom UI component for message status (delivered/read)
     * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Message/MessageSimple/MessageStatus.tsx
     *
     * */
    MessageStatus?: React.ComponentType<
      ForwardedMessageProps<At, Ch, Co, Ev, Me, Re, Us>
    >;
    /** Custom UI component for message text */
    MessageText?: React.ComponentType<
      MessageTextProps<At, Ch, Co, Ev, Me, Re, Us>
    >;
    /**
     * Function that overrides default behavior when message is long pressed
     * e.g. if you would like to open reaction picker on message long press:
     *
     * ```
     * import { MessageSimple } from 'stream-chat-react-native' // or 'stream-chat-expo'
     * ...
     * const MessageUIComponent = (props) => {
     *  return (
     *    <MessageSimple
     *      {...props}
     *      onLongPress={(message, e) => {
     *        props.openReactionPicker();
     *        // Or if you want to open action sheet
     *        // props.showActionSheet();
     *      }}
     *  )
     * }
     * ```
     *
     * Similarly, you can call other methods available on the Message
     * component such as handleEdit, handleDelete, handleAction etc.
     *
     * Source - [Message](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Message/Message.tsx)
     *
     * By default, we show the action sheet with all the message actions on long press.
     *
     * @param message Message object which was long pressed
     * @param event   Event object for onLongPress event
     * */
    onLongPress?: (
      message: Message<At, Ch, Co, Ev, Me, Re, Us>,
      event: GestureResponderEvent,
    ) => void;
    /**
     * Function that overrides default behavior when message is pressed/touched
     * e.g. if you would like to open reaction picker on message press:
     *
     * ```
     * import { MessageSimple } from 'stream-chat-react-native' // or 'stream-chat-expo'
     * ...
     * const MessageUIComponent = (props) => {
     *  return (
     *    <MessageSimple
     *      {...props}
     *      onPress={(message, e) => {
     *        props.openReactionPicker();
     *        // Or if you want to open action sheet
     *        // props.showActionSheet();
     *      }}
     *  )
     * }
     * ```
     *
     * Similarly, you can call other methods available on the Message
     * component such as handleEdit, handleDelete, handleAction etc.
     *
     * Source - [Message](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Message/Message.tsx)
     *
     * By default, messages do not have an on press action.
     *
     * @param message Message object which was long pressed
     * @param event   Event object for onLongPress event
     * */
    onPress?: (
      message: Message<At, Ch, Co, Ev, Me, Re, Us>,
      event: GestureResponderEvent,
    ) => void;
    /**
     * Custom UI component to display reaction list.
     * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Reaction/ReactionList.tsx
     */
    ReactionList?: React.ComponentType<
      ReactionListProps<At, Ch, Co, Me, Re, Us>
    >;
    showMessageStatus?: boolean;
    /**
     * e.g.,
     * [
     *  {
     *    id: 'like',
     *    icon: '👍',
     *  },
     *  {
     *    id: 'love',
     *    icon: '❤️️',
     *  },
     *  {
     *    id: 'haha',
     *    icon: '😂',
     *  },
     *  {
     *    id: 'wow',
     *    icon: '😮',
     *  },
     * ]
     */
    supportedReactions?: {
      icon: string;
      id: string;
    }[];
    /**
     * Custom UI component to display enriched url preview.
     * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/Card.tsx
     */
    UrlPreview?: React.ComponentType<CardProps<At>>;
  };

/**
 *
 * Message UI component
 *
 * @example ./MessageSimple.md
 */
export const MessageSimple = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageSimpleProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    forceAlign = false,
    groupStyles,
    isMyMessage,
    message,
    MessageAvatar = DefaultMessageAvatar,
    MessageContent = DefaultMessageContent,
    MessageStatus = DefaultMessageStatus,
    reactionsEnabled = true,
    showMessageStatus = true,
  } = props;

  const { channel } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();

  const customMessageContent = !!props.MessageContent;

  const alignment =
    forceAlign && (forceAlign === 'left' || forceAlign === 'right')
      ? forceAlign
      : isMyMessage(message)
      ? 'right'
      : 'left';

  const isVeryLastMessage =
    channel?.state.messages[channel?.state.messages.length - 1]?.id ===
    message.id;
  const hasMarginBottom =
    groupStyles[0] === 'single' || groupStyles[0] === 'bottom';

  const forwardedProps = {
    ...props,
    alignment,
    customMessageContent,
    groupStyles:
      reactionsEnabled &&
      message.latest_reactions &&
      message.latest_reactions.length > 0 &&
      props.ReactionList
        ? (['bottom'] as GroupType[])
        : groupStyles,
  };

  return (
    <Container
      alignment={alignment}
      hasMarginBottom={hasMarginBottom}
      isVeryLastMessage={isVeryLastMessage}
      testID='message-simple-wrapper'
    >
      {alignment === 'right' ? (
        <>
          <MessageContent<At, Ch, Co, Ev, Me, Re, Us> {...forwardedProps} />
          <MessageAvatar<At, Ch, Co, Ev, Me, Re, Us> {...forwardedProps} />
          {showMessageStatus && (
            <MessageStatus<At, Ch, Co, Ev, Me, Re, Us> {...forwardedProps} />
          )}
        </>
      ) : (
        <>
          <MessageAvatar<At, Ch, Co, Ev, Me, Re, Us> {...forwardedProps} />
          <MessageContent<At, Ch, Co, Ev, Me, Re, Us> {...forwardedProps} />
        </>
      )}
    </Container>
  );
};
