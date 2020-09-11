import { useEffect } from 'react';
import uniqBy from 'lodash/uniqBy';
import type {
  Channel,
  Event,
  LiteralStringForUnion,
  UnknownType,
} from 'stream-chat';

import { getChannel } from '../../utils';
import { useChatContext } from '../../../../contexts/ChatContext';

type Parameters<
  ChannelType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  AttachmentType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  EventType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion
> = {
  onAddedToChannel: (
    setChannels: React.Dispatch<
      React.SetStateAction<
        Channel<
          AttachmentType,
          ChannelType,
          EventType,
          MessageType,
          ReactionType,
          UserType,
          CommandType
        >[]
      >
    >,
    e: Event<
      EventType,
      AttachmentType,
      ChannelType,
      MessageType,
      ReactionType,
      UserType,
      CommandType
    >,
  ) => void;
  setChannels: React.Dispatch<
    React.SetStateAction<
      Channel<
        AttachmentType,
        ChannelType,
        EventType,
        MessageType,
        ReactionType,
        UserType,
        CommandType
      >[]
    >
  >;
};

export const useAddedToChannelNotification = <
  ChannelType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  AttachmentType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  EventType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion
>({
  onAddedToChannel,
  setChannels,
}: Parameters<
  ChannelType,
  UserType,
  MessageType,
  AttachmentType,
  ReactionType,
  EventType,
  CommandType
>) => {
  const { client } = useChatContext<
    ChannelType,
    UserType,
    MessageType,
    AttachmentType,
    ReactionType,
    EventType,
    CommandType
  >();

  useEffect(() => {
    const handleEvent = async (
      e: Event<
        EventType,
        AttachmentType,
        ChannelType,
        MessageType,
        ReactionType,
        UserType,
        CommandType
      >,
    ) => {
      if (typeof onAddedToChannel === 'function') {
        onAddedToChannel(setChannels, e);
      } else {
        const channel = await getChannel(
          client,
          e.channel?.type,
          e.channel?.id,
        );
        setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
      }
    };

    client.on('notification.added_to_channel', handleEvent);
    return () => client.off('notification.added_to_channel', handleEvent);
  }, []);
};
