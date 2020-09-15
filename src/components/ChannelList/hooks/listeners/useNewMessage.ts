import { useEffect } from 'react';
import type {
  Channel,
  Event,
  LiteralStringForUnion,
  UnknownType,
} from 'stream-chat';

import { moveChannelUp } from '../../utils';
import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

type Parameters<
  AttachmentType extends UnknownType = UnknownType,
  ChannelType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion,
  EventType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType
> = {
  lockChannelOrder: boolean;
  setChannels: React.Dispatch<
    React.SetStateAction<
      Channel<
        AttachmentType,
        ChannelType,
        CommandType,
        EventType,
        MessageType,
        ReactionType,
        UserType
      >[]
    >
  >;
};

export const useNewMessage = <
  AttachmentType extends UnknownType = UnknownType,
  ChannelType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion,
  EventType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType
>({
  lockChannelOrder,
  setChannels,
}: Parameters<
  AttachmentType,
  ChannelType,
  CommandType,
  EventType,
  MessageType,
  ReactionType,
  UserType
>) => {
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
    const handleEvent = (
      e: Event<
        AttachmentType,
        ChannelType,
        CommandType,
        EventType,
        MessageType,
        ReactionType,
        UserType
      >,
    ) => {
      setChannels((channels) => {
        if (!lockChannelOrder && e.cid)
          return moveChannelUp<
            AttachmentType,
            ChannelType,
            CommandType,
            EventType,
            MessageType,
            ReactionType,
            UserType
          >({ channels, cid: e.cid });
        return [...channels];
      });
    };

    client.on('message.new', handleEvent);
    return () => client.off('message.new', handleEvent);
  }, []);
};
