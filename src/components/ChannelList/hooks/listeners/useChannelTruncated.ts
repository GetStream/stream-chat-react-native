import { useEffect } from 'react';
import type {
  Channel,
  Event,
  LiteralStringForUnion,
  UnknownType,
} from 'stream-chat';

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
  onChannelTruncated: (
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
    >,
    e: Event<
      AttachmentType,
      ChannelType,
      CommandType,
      EventType,
      MessageType,
      ReactionType,
      UserType
    >,
  ) => void;
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
  setForceUpdate: React.Dispatch<React.SetStateAction<number>>;
};

export const useChannelTruncated = <
  AttachmentType extends UnknownType = UnknownType,
  ChannelType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion,
  EventType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType
>({
  onChannelTruncated,
  setChannels,
  setForceUpdate,
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
      if (typeof onChannelTruncated === 'function') {
        onChannelTruncated(setChannels, e);
      }
      setForceUpdate((count) => count + 1);
    };

    client.on('channel.truncated', handleEvent);
    return () => client.off('channel.truncated', handleEvent);
  }, []);
};
