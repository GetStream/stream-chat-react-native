import React, { useState } from 'react';
import { Keyboard, TouchableOpacity } from 'react-native';

import {
  MessageSimple as DefaultMessageSimple,
  MessageSimpleProps,
} from './MessageSimple/MessageSimple';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import {
  ChatContextValue,
  useChatContext,
} from '../../contexts/chatContext/ChatContext';
import {
  KeyboardContextValue,
  useKeyboardContext,
} from '../../contexts/keyboardContext/KeyboardContext';
import {
  GroupType,
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';

import type {
  MessageResponse,
  Reaction,
  ReactionResponse,
  Message as StreamMessage,
  UserResponse,
} from 'stream-chat';

import type { ActionSheetStyles } from './MessageSimple/MessageActionSheet';
import type { FileIconProps } from '../Attachment/FileIcon';
import type { Message as InsertDatesMessage } from '../MessageList/utils/insertDates';
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

export type ActionProps = {
  reactionsEnabled?: boolean;
  repliesEnabled?: boolean;
};

export type MessagePropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = MessageProps<At, Ch, Co, Ev, Me, Re, Us> & {
  channel: ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['channel'];
  client: ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>['client'];
  disabled: ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['disabled'];
  dismissKeyboard: KeyboardContextValue['dismissKeyboard'];
  emojiData: MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>['emojiData'];
  removeMessage: MessagesContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['removeMessage'];
  retrySendMessage: MessagesContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['retrySendMessage'];
  setEditingState: MessagesContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['setEditingState'];
  updateMessage: MessagesContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['updateMessage'];
};

/**
 * Since this component doesn't consume `messages` from `MessagesContext`,
 * we memoized and broke it up to prevent new messages from re-rendering
 * each individual Message component.
 */
const DefaultMessageWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessagePropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    channel,
    client,
    disabled,
    dismissKeyboard,
    dismissKeyboardOnMessageTouch,
    emojiData,
    message,
    Message: MessageSimple = DefaultMessageSimple,
    removeMessage,
    retrySendMessage,
    setEditingState,
    updateMessage,
    ...rest
  } = props;

  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false);

  const actionsEnabled =
    message.type === 'regular' && message.status === 'received';

  /**
   * TODO: Remove these functions and replace with booleans
   */
  const isMyMessage = () =>
    client && message && client.user?.id === message.user?.id;

  const isAdmin = () =>
    client?.user?.role === 'admin' ||
    channel?.state.membership.role === 'admin';

  const isOwner = () => channel?.state.membership.role === 'owner';

  const isModerator = () =>
    channel?.state.membership.role === 'channel_moderator' ||
    channel?.state.membership.role === 'moderator';

  /**
   * TODO: Consolidate these function into one
   */
  const canEditMessage = () =>
    isMyMessage() || isModerator() || isOwner() || isAdmin();

  const canDeleteMessage = () => canEditMessage();

  const handleEdit = () => setEditingState(message);

  const handleDelete = async () => {
    if (message.id) {
      const data = await client.deleteMessage(message.id);
      updateMessage(data.message);
    }
  };

  const handleFlag = async () => {
    if (message.id) {
      await client.flagMessage(message.id);
    }
  };

  const handleMute = async () => {
    if (message.user?.id) {
      await client.muteUser(message.user.id);
    }
  };

  const showActionSheet = async () => {
    await dismissKeyboard();
    setActionSheetVisible(true);
  };

  const openReactionPicker = async () => {
    if (disabled) return;
    /**
     * Keyboard closes automatically whenever modal is opened (currently there is no way of avoiding this afaik)
     * So we need to postpone the calculation for the reaction picker position until after the keyboard closes.
     * To achieve this, we close the keyboard forcefully and then calculate position of picker in callback.
     */
    await dismissKeyboard();
    setReactionPickerVisible(true);
  };

  const dismissReactionPicker = () => setReactionPickerVisible(false);

  const handleReaction = async (reactionType: string) => {
    setReactionPickerVisible(false);

    let userExistingReaction;

    if (Array.isArray(message.own_reactions)) {
      for (const reaction of message.own_reactions) {
        /**
         * Own user should only ever contain the current user id, just in
         * case we check to prevent bugs with message updates from breaking reactions
         */
        if (
          client.userID === reaction.user?.id &&
          reaction.type === reactionType
        ) {
          userExistingReaction = reaction;
        } else if (client.userID !== reaction.user?.id) {
          console.warn(
            `message.own_reactions contained reactions from a different user, this indicates a bug`,
          );
        }
      }
    }

    // Add reaction to local state, make API call in background, revert to old message if fails
    try {
      if (channel) {
        if (userExistingReaction) {
          channel.state.removeReaction(userExistingReaction);
          if (message.id) {
            await channel.deleteReaction(message.id, userExistingReaction.type);
          }
        } else {
          const tmpReaction = {
            created_at: new Date(),
            message_id: message.id,
            type: reactionType,
            updated_at: new Date(),
            user: client.user,
          };

          channel.state.addReaction(
            (tmpReaction as unknown) as ReactionResponse<Re, Us>,
          );
          if (message.id) {
            await channel.sendReaction(message.id, {
              type: reactionType,
            } as Reaction<Re, Us>);
          }
        }
      }
    } catch (_error) {
      setReactionPickerVisible(true);
      updateMessage(message as MessageResponse<At, Ch, Co, Me, Re, Us>);
    }
  };

  const handleAction = async (name: string, value: string) => {
    if (message.id) {
      const data = await channel?.sendAction(message.id, { [name]: value });
      if (data?.message) {
        updateMessage(data.message);
      } else {
        removeMessage({
          id: message.id,
          parent_id: message.parent_id as StreamMessage<
            At,
            Me,
            Us
          >['parent_id'],
        });
      }
    }
  };

  const handleRetry = async () =>
    await retrySendMessage({
      ...message,
      updated_at: undefined,
    } as MessageResponse<At, Ch, Co, Me, Re, Us>);

  const getTotalReactionCount = (
    supportedReactions: {
      icon: string;
      id: string;
    }[],
  ) => {
    let count = 0;
    if (!supportedReactions) {
      supportedReactions = emojiData;
    }

    const reactionCounts = message.reaction_counts;

    if (reactionCounts && Object.keys(reactionCounts).length > 0) {
      Object.keys(reactionCounts).forEach((key) => {
        if (
          supportedReactions.find(
            (supportedReaction) => supportedReaction.id === key,
          )
        ) {
          count += reactionCounts[key];
        }
      });
    }
    return count;
  };

  const actionProps = {} as ActionProps;
  if (typeof channel?.getConfig === 'function') {
    const reactions = channel.getConfig()?.reactions;
    actionProps.reactionsEnabled = reactions;
    actionProps.repliesEnabled = reactions;
  }

  const onPress = () => {
    if (dismissKeyboardOnMessageTouch) {
      Keyboard.dismiss();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      testID='message-wrapper'
    >
      <MessageSimple<At, Ch, Co, Ev, Me, Re, Us>
        {...rest}
        {...actionProps}
        actionsEnabled={actionsEnabled}
        actionSheetVisible={actionSheetVisible}
        canDeleteMessage={canDeleteMessage}
        canEditMessage={canEditMessage}
        dismissReactionPicker={dismissReactionPicker}
        getTotalReactionCount={getTotalReactionCount}
        handleAction={handleAction}
        handleDelete={handleDelete}
        handleEdit={handleEdit}
        handleFlag={handleFlag}
        handleMute={handleMute}
        handleReaction={handleReaction}
        handleRetry={handleRetry}
        isAdmin={isAdmin}
        isModerator={isModerator}
        isMyMessage={isMyMessage}
        message={message}
        Message={MessageSimple}
        onPress={onPress}
        openReactionPicker={openReactionPicker}
        reactionPickerVisible={reactionPickerVisible}
        setActionSheetVisible={setActionSheetVisible}
        showActionSheet={showActionSheet}
      />
    </TouchableOpacity>
  );
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: MessagePropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessagePropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    lastReceivedId: prevLastReceivedId,
    message: prevMessage,
    readBy: prevReadBy,
  } = prevProps;
  const {
    lastReceivedId: nextLastReceivedId,
    message: nextMessage,
    readBy: nextReadBy,
  } = nextProps;

  const messageEqual = prevMessage.updated_at === nextMessage.updated_at;

  const lastReceivedIdEqual =
    prevLastReceivedId === nextLastReceivedId ||
    (prevLastReceivedId !== nextMessage.id &&
      nextLastReceivedId !== nextMessage.id &&
      prevLastReceivedId !== prevMessage.id &&
      nextLastReceivedId !== prevMessage.id);

  const reactionsEqual =
    prevMessage.latest_reactions?.length ===
    nextMessage.latest_reactions?.length;
  const repliesEqual = prevMessage.reply_count === nextMessage.reply_count;

  const readByEqual = prevReadBy === nextReadBy;
  return (
    messageEqual &&
    reactionsEqual &&
    repliesEqual &&
    lastReceivedIdEqual &&
    readByEqual
  );
};

const MemoizedDefaultMessage = React.memo(
  DefaultMessageWithContext,
  areEqual,
) as typeof DefaultMessageWithContext;

export type MessageProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /**
   * Position of message in group - top, bottom, middle, single.
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyles: GroupType[];
  /**
   * Current [message object](https://getstream.io/chat/docs/#message_format)
   */
  message: InsertDatesMessage<At, Ch, Co, Ev, Me, Re, Us>;
  /**
   * Style object for action sheet (used to message actions).
   * Supported styles: https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js
   */
  actionSheetStyles?: ActionSheetStyles;
  /**
   * Custom UI component for attachment icon for type 'file' attachment.
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/FileIcon.tsx
   */
  AttachmentFileIcon?: React.ComponentType<FileIconProps>;
  /** Should keyboard be dismissed when messaged is touched */
  dismissKeyboardOnMessageTouch?: boolean;
  /**
   * Latest message id on current channel
   */
  lastReceivedId?: string;
  /**
   * Custom UI component to display a message in MessageList component
   * Default component (accepts the same props): [MessageSimple](https://getstream.github.io/stream-chat-react-native/#messagesimple)
   * */
  Message?: React.ComponentType<MessageSimpleProps<At, Ch, Co, Ev, Me, Re, Us>>;
  /**
   * Custom message actions to display on open of the action sheet
   */
  messageActions?: boolean | string[];
  /**
   * Handler to open the thread on message. This is callback for touch event for replies button.
   *
   * @param message A message object to open the thread upon.
   */
  onThreadSelect?: (
    message: InsertDatesMessage<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /**
   * A list of users that have read this message
   **/
  readBy?: UserResponse<Us>[];
  /**
   * Whether or not the MessageList is part of a Thread
   */
  threadList?: boolean;
};

/**
 * Message - A high level component which implements all the logic required for a message.
 * The actual rendering of the message is delegated via the "Message" property
 *
 * @example ./Message.md
 */
export const Message = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { channel, disabled } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { dismissKeyboard } = useKeyboardContext();
  const {
    emojiData,
    removeMessage,
    retrySendMessage,
    setEditingState,
    updateMessage,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();

  return (
    <MemoizedDefaultMessage<At, Ch, Co, Ev, Me, Re, Us>
      {...props}
      {...{
        channel,
        client,
        disabled,
        dismissKeyboard,
        emojiData,
        removeMessage,
        retrySendMessage,
        setEditingState,
        updateMessage,
      }}
    />
  );
};
