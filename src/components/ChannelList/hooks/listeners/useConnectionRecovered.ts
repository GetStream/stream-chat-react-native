import { useEffect } from 'react';
import type { LiteralStringForUnion, UnknownType } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

type Parameters = {
  setForceUpdate: React.Dispatch<React.SetStateAction<number>>;
};

export const useConnectionRecovered = <
  AttachmentType extends UnknownType = UnknownType,
  ChannelType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion,
  EventType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType
>({
  setForceUpdate,
}: Parameters) => {
  const { client } = useChatContext<
    AttachmentType,
    ChannelType,
    CommandType,
    EventType,
    MessageType,
    ReactionType,
    UserType
  >();

  useEffect(() => {
    const handleEvent = () => {
      setForceUpdate((count) => count + 1);
    };

    client.on('connection.recovered', handleEvent);
    return () => client.off('connection.recovered', handleEvent);
  }, []);
};
