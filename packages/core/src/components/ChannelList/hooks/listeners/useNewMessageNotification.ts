import uniqBy from 'lodash/uniqBy';
import { useEffect } from 'react';

import { getChannel } from '../../utils';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { Channel, Event } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../../types/types';

type Parameters<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = {
  setChannels: React.Dispatch<React.SetStateAction<Channel<At, Ch, Co, Ev, Me, Re, Us>[]>>;
  onMessageNew?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel<At, Ch, Co, Ev, Me, Re, Us>[]>>,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
};

export const useNewMessageNotification = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>({
  onMessageNew,
  setChannels,
}: Parameters<At, Ch, Co, Ev, Me, Re, Us>) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  useEffect(() => {
    const handleEvent = async (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (typeof onMessageNew === 'function') {
        onMessageNew(setChannels, event);
      } else {
        if (event.channel?.id && event.channel?.type) {
          const channel = await getChannel({
            client,
            id: event.channel.id,
            type: event.channel.type,
          });
          setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
        }
      }
    };

    client.on('notification.message_new', handleEvent);
    return () => client.off('notification.message_new', handleEvent);
  }, []);
};
