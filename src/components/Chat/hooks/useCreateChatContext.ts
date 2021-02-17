import { useMemo } from 'react';

import type { ChatContextValue } from '../../../contexts/chatContext/ChatContext';
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

export const useCreateChatContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  channel,
  client,
  connectionRecovering,
  isOnline,
  setActiveChannel,
}: ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>) => {
  const channelId = channel?.id;
  const clientValues = `${client.clientID}${
    Object.keys(client.activeChannels).length
  }${Object.keys(client.listeners).length}${client.mutedChannels.length}`;

  const chatContext: ChatContextValue<At, Ch, Co, Ev, Me, Re, Us> = useMemo(
    () => ({
      channel,
      client,
      connectionRecovering,
      isOnline,
      setActiveChannel,
    }),
    [channelId, clientValues, connectionRecovering, isOnline],
  );

  return chatContext;
};
