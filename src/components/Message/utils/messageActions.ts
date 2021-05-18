import type { MessageType } from '../../MessageList/hooks/useMessageList';

import type { MessageAction } from '../../../contexts/messageOverlayContext/MessageOverlayContext';
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

export const messageActions = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
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
  muteUser,
  quotedRepliesEnabled,
  quotedReply,
  retry,
  threadRepliesEnabled,
  threadReply,
}: {
  blockUser: MessageAction | null;
  canModifyMessage: boolean;
  copyMessage: MessageAction | null;
  deleteMessage: MessageAction | null;
  editMessage: MessageAction | null;
  error: boolean;
  flagMessage: MessageAction | null;
  isMyMessage: boolean;
  isThreadMessage: boolean;
  message: MessageType<At, Ch, Co, Ev, Me, Re, Us>;
  messageReactions: boolean;
  muteUser: MessageAction | null;
  quotedReply: MessageAction | null;
  retry: MessageAction | null;
  threadReply: MessageAction | null;
  quotedRepliesEnabled?: boolean;
  threadRepliesEnabled?: boolean;
}): Array<MessageAction | null> | undefined => {
  if (messageReactions) {
    return undefined;
  }

  const actions: Array<MessageAction | null> = [];

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
    actions.push(muteUser);
  }

  if (!isMyMessage) {
    actions.push(flagMessage);
  }

  if (!isMyMessage && canModifyMessage) {
    actions.push(blockUser);
  }

  if (canModifyMessage) {
    actions.push(deleteMessage);
  }

  return actions;
};
