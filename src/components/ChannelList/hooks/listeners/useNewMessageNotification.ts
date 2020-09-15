import uniqBy from 'lodash/uniqBy';
import { useEffect } from 'react';
import type {
  Channel,
  Event,
  LiteralStringForUnion,
  UnknownType,
} from 'stream-chat';

import { getChannel } from '../../utils';
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
  onMessageNew: (
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

export const useNewMessageNotification = <
  AttachmentType extends UnknownType = UnknownType,
  ChannelType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion,
  EventType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType
>({
  onMessageNew,
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
    const handleEvent = async (
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
      if (typeof onMessageNew === 'function') {
        onMessageNew(setChannels, e);
      } else {
        if (e.channel?.id && e.channel?.type) {
          const channel = await getChannel({
            client,
            id: e.channel.id,
            type: e.channel.type,
          });
          setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
        }
      }
    };

    client.on('notification.message_new', handleEvent);
    return () => client.off('notification.message_new', handleEvent);
  }, []);
};
