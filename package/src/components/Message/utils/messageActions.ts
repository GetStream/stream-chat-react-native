import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
import type { OwnCapabilitiesContextValue } from '../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import type { MessageActionType } from '../../MessageOverlay/MessageActionListItem';

export type MessageActionsParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  blockUser: MessageActionType;
  copyMessage: MessageActionType;
  deleteMessage: MessageActionType;
  dismissOverlay: () => void;
  editMessage: MessageActionType;
  error: boolean | Error;
  flagMessage: MessageActionType;
  isThreadMessage: boolean;
  messageReactions: boolean;
  muteUser: MessageActionType;
  ownCapabilities: OwnCapabilitiesContextValue;
  pinMessage: MessageActionType;
  quotedReply: MessageActionType;
  retry: MessageActionType;
  threadReply: MessageActionType;
  unpinMessage: MessageActionType;
} & Pick<MessageContextValue<StreamChatGenerics>, 'message' | 'isMyMessage'>;

export type MessageActionsProp<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = (param: MessageActionsParams<StreamChatGenerics>) => MessageActionType[];

export const messageActions = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  blockUser,
  copyMessage,
  deleteMessage,
  editMessage,
  error,
  flagMessage,
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
  if (messageReactions) {
    return undefined;
  }

  const actions: Array<MessageActionType | null> = [];

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

  if (message.text && !error) {
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
    actions.push(blockUser);
  }

  if (
    (isMyMessage && ownCapabilities.deleteOwnMessage) ||
    (!isMyMessage && ownCapabilities.deleteAnyMessage)
  ) {
    actions.push(deleteMessage);
  }

  return actions;
};
