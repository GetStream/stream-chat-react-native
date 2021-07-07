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
import type { MessageType } from '../hooks/useMessageList';

export const getLastReceivedMessage = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  messages: MessageType<At, Ch, Co, Ev, Me, Re, Us>[],
) => {
  /**
   * There are no status on dates so they will be skipped
   */
  for (const message of messages) {
    if (message?.status === 'received' || message?.status === 'sending') {
      return message;
    }
  }

  return;
};
