import type { MessageType } from '../../../types/messageTypes';
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

export const removeReservedFields = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  message: MessageType<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const retryMessage = { ...message };
  const reserved = [
    'cid',
    'config',
    'created_at',
    'created_by',
    'id',
    'last_message_at',
    'member_count',
    'type',
    'updated_at',
  ];
  reserved.forEach((key) => {
    delete retryMessage[key];
  });

  return retryMessage;
};
