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
  onRemovedFromChannel: (
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
};

export const useRemovedFromChannelNotification = <
  AttachmentType extends UnknownType = UnknownType,
  ChannelType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion,
  EventType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType
>({
  onRemovedFromChannel,
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
      if (typeof onRemovedFromChannel === 'function') {
        onRemovedFromChannel(setChannels, e);
      } else {
        setChannels((channels) => {
          const newChannels = channels.filter((c) => c.cid !== e.channel?.cid);
          return [...newChannels];
        });
      }
    };

    client.on('notification.removed_from_channel', handleEvent);
    return () => client.off('notification.removed_from_channel', handleEvent);
  }, []);
};
