import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
import type { OwnCapabilitiesContextValue } from '../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { setClipboardString } from '../../../native';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import type { MessageActionType } from '../../MessageOverlay/MessageActionListItem';

export type MessageActionsParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  banUser: MessageActionType;
  copyMessage: MessageActionType;
  deleteMessage: MessageActionType;
  dismissOverlay: () => void;
  editMessage: MessageActionType;
  error: boolean | Error;
  flagMessage: MessageActionType;
  /**
   * Determines if the message actions are visible.
   */
  isMessageActionsVisible: boolean;
  isThreadMessage: boolean;
  /**
   * @deprecated use `isMessageActionsVisible` instead.
   */
  messageReactions: boolean;
  muteUser: MessageActionType;
  ownCapabilities: OwnCapabilitiesContextValue;
  pinMessage: MessageActionType;
  quotedReply: MessageActionType;
  retry: MessageActionType;
  threadReply: MessageActionType;
  unpinMessage: MessageActionType;
  /**
   * @deprecated use `banUser` instead.
   */
  blockUser?: MessageActionType;
} & Pick<MessageContextValue<StreamChatGenerics>, 'message' | 'isMyMessage'>;

export type MessageActionsProp<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = (param: MessageActionsParams<StreamChatGenerics>) => MessageActionType[];

export const messageActions = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  banUser,
  blockUser,
  copyMessage,
  deleteMessage,
  editMessage,
  error,
  flagMessage,
  isMessageActionsVisible,
  isMyMessage,
  isThreadMessage,
  message,
  messageReactions,
  ownCapabilities,
  pinMessage,
  quotedReply,
  retry,
  threadReply,
  unpinMessage,
}: MessageActionsParams<StreamChatGenerics>) => {
  if (messageReactions || !isMessageActionsVisible) {
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

  if (setClipboardString !== null && message.text && !error) {
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
    actions.push(banUser || blockUser);
  }

  if (
    (isMyMessage && ownCapabilities.deleteOwnMessage) ||
    (!isMyMessage && ownCapabilities.deleteAnyMessage)
  ) {
    actions.push(deleteMessage);
  }

  return actions;
};
