import type { MessageType } from '../components/MessageList/hooks/useMessageList';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../types/types';

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
] as const;

type ReservedType = typeof reserved;

export const removeReservedFields = <
  T extends Partial<
    Pick<
      MessageType<
        DefaultAttachmentType,
        DefaultChannelType,
        DefaultCommandType,
        DefaultEventType,
        DefaultMessageType,
        DefaultReactionType,
        DefaultUserType
      >,
      ReservedType[number]
    >
  >
>(
  message: T,
) => {
  const retryMessage = { ...message };

  reserved.forEach((key) => {
    delete retryMessage[key];
  });

  return retryMessage;
};
