import type { MessageActionType } from '../../MessageOverlay/MessageActionListItem';
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
import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
import type { MessagesContextValue } from '../../../contexts/messagesContext/MessagesContext';

export type MessageActionsProps = {
  blockUser: MessageActionType;
  copyMessage: MessageActionType;
  deleteMessage: MessageActionType;
  editMessage: MessageActionType;
  flagMessage: MessageActionType;
  muteUser: MessageActionType;
  pinMessage: MessageActionType;
  quotedReply: MessageActionType;
  retry: MessageActionType;
  threadReply: MessageActionType;
  unpinMessage: MessageActionType;
};

export const messageActions = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>({
  blockUser,
  canModifyMessage,
  copyMessage,
  deleteMessage,
  editMessage,
  error,
  flagMessage,
  isMyMessage,
  isThreadMessage,
  message,
  messageReactions,
  mutesEnabled,
  muteUser,
  pinMessage,
  pinMessageEnabled,
  quotedRepliesEnabled,
  quotedReply,
  retry,
  threadRepliesEnabled,
  threadReply,
  unpinMessage,
}: {
  canModifyMessage: boolean;
  error: boolean | Error;
  isThreadMessage: boolean;
  messageReactions: boolean;
} & MessageActionsProps &
  Pick<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'message' | 'isMyMessage'> &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'mutesEnabled' | 'quotedRepliesEnabled' | 'pinMessageEnabled' | 'threadRepliesEnabled'
  >): Array<MessageActionType | null> | undefined => {
  if (messageReactions) {
    return undefined;
  }

  const actions: Array<MessageActionType | null> = [];

  if (error && isMyMessage) {
    actions.push(retry);
  }

  if (quotedRepliesEnabled && !isThreadMessage && !error) {
    actions.push(quotedReply);
  }

  if (threadRepliesEnabled && !isThreadMessage && !error) {
    actions.push(threadReply);
  }

  if (canModifyMessage) {
    actions.push(editMessage);
  }

  if (message.text && !error) {
    actions.push(copyMessage);
  }

  if (!isMyMessage) {
    actions.push(flagMessage);
  }

  if (pinMessageEnabled && !message.pinned) {
    actions.push(pinMessage);
  }

  if (pinMessageEnabled && message.pinned) {
    actions.push(unpinMessage);
  }

  if (mutesEnabled && !isMyMessage) {
    actions.push(muteUser);
  }

  if (!isMyMessage && canModifyMessage) {
    actions.push(blockUser);
  }

  if (canModifyMessage) {
    actions.push(deleteMessage);
  }

  return actions;
};
