import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
import type { OwnCapabilitiesContextValue } from '../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { isClipboardAvailable } from '../../../native';

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
  /**
   * Determines if the message actions are visible.
   */
  showMessageReactions: boolean;
  threadReply: MessageActionType;
  unpinMessage: MessageActionType;
} & Pick<MessageContextValue, 'message' | 'isMyMessage'>;

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
  message,
  ownCapabilities,
  pinMessage,
  quotedReply,
  retry,
  showMessageReactions,
  threadReply,
  unpinMessage,
}: MessageActionsParams) => {
  if (showMessageReactions) {
    return [];
  }

  const actions: Array<MessageActionType> = [];

  if (error && isMyMessage) {
    actions.push(retry);
  }

  if (ownCapabilities.quoteMessage && !isThreadMessage && !error) {
    actions.push(quotedReply);
  }

  if (ownCapabilities.sendReply && !isThreadMessage && !error) {
    actions.push(threadReply);
  }

  if (
    (isMyMessage && ownCapabilities.updateOwnMessage) ||
    (!isMyMessage && ownCapabilities.updateAnyMessage)
  ) {
    actions.push(editMessage);
  }

  if (ownCapabilities.readEvents && !error && !isThreadMessage) {
    actions.push(markUnread);
  }

  if (isClipboardAvailable() && message.text && !error) {
    actions.push(copyMessage);
  }

  if (!isMyMessage && ownCapabilities.flagMessage) {
    actions.push(flagMessage);
  }

  if (ownCapabilities.pinMessage && !message.pinned) {
    actions.push(pinMessage);
  }

  if (ownCapabilities.pinMessage && message.pinned) {
    actions.push(unpinMessage);
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

  return actions;
};
