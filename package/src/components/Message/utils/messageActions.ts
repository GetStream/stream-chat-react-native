import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
import type { MessagesContextValue } from '../../../contexts/messagesContext/MessagesContext';
import type { OwnCapabilitiesContextValue } from '../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { isClipboardAvailable } from '../../../native';

import { FileTypes } from '../../../types/types';
import type { MessageActionType } from '../../MessageMenu/MessageActionListItem';

export type MessageActionsParams = {
  banUser: MessageActionType;
  copyMessage: MessageActionType;
  deleteMessage: MessageActionType;
  dismissOverlay: () => void;
  editMessage: MessageActionType;
  error: boolean | Error;
  flagMessage: MessageActionType;
  isThreadMessage: boolean;
  markUnread: MessageActionType;
  muteUser: MessageActionType;
  ownCapabilities: OwnCapabilitiesContextValue;
  pinMessage: MessageActionType;
  quotedReply: MessageActionType;
  retry: MessageActionType;
  threadReply: MessageActionType;
  unpinMessage: MessageActionType;
  blockUser: MessageActionType;
  // Optional Actions
  deleteForMeMessage?: MessageActionType;
} & Pick<MessageContextValue, 'message' | 'isMyMessage'> &
  Pick<MessagesContextValue, 'updateMessage'>;

export type MessageActionsProp = (param: MessageActionsParams) => MessageActionType[];

export const messageActions = ({
  banUser,
  copyMessage,
  deleteMessage,
  editMessage,
  error,
  flagMessage,
  isMyMessage,
  isThreadMessage,
  markUnread,
  muteUser,
  message,
  ownCapabilities,
  pinMessage,
  quotedReply,
  retry,
  threadReply,
  unpinMessage,
  blockUser,
}: MessageActionsParams) => {
  const messageHasGiphyOrImgur = message.attachments?.some(
    (attachment) => attachment.type === FileTypes.Giphy || attachment.type === FileTypes.Imgur,
  );

  const actions: Array<MessageActionType> = [];

  if (error && isMyMessage) {
    actions.push(retry);
  }

  if (ownCapabilities.sendReply && !isThreadMessage && !error) {
    actions.push(threadReply);
  }

  if (ownCapabilities.quoteMessage && !isThreadMessage && !error) {
    actions.push(quotedReply);
  }

  if (ownCapabilities.pinMessage && !message.pinned) {
    actions.push(pinMessage);
  }

  if (ownCapabilities.pinMessage && message.pinned) {
    actions.push(unpinMessage);
  }

  if (
    ((isMyMessage && ownCapabilities.updateOwnMessage) ||
      (!isMyMessage && ownCapabilities.updateAnyMessage)) &&
    !messageHasGiphyOrImgur &&
    !message.poll_id
  ) {
    actions.push(editMessage);
  }

  if (isClipboardAvailable() && message.text && !error) {
    actions.push(copyMessage);
  }

  if (ownCapabilities.readEvents && !error && !isThreadMessage) {
    actions.push(markUnread);
  }

  if (!isMyMessage && ownCapabilities.banChannelMembers) {
    actions.push(banUser);
  }

  if (
    (isMyMessage && ownCapabilities.deleteOwnMessage) ||
    (!isMyMessage && ownCapabilities.deleteAnyMessage)
  ) {
    actions.push(deleteMessage);
  }

  if (!isMyMessage && ownCapabilities.flagMessage) {
    actions.push(flagMessage);
  }

  if (!isMyMessage) {
    actions.push(muteUser);
    actions.push(blockUser);
  }

  if (error) {
    return actions.filter(
      (action) =>
        action.actionType === 'deleteMessage' ||
        action.actionType === 'retry' ||
        action.actionType === 'editMessage',
    );
  }

  return actions;
};
