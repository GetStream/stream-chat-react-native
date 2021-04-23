import { useEffect } from 'react';
import uniqBy from 'lodash/uniqBy';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
import { getChannel } from '../../utils';

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
  Us extends UnknownType = DefaultUserType
> = {
  setChannels: React.Dispatch<
    React.SetStateAction<Channel<At, Ch, Co, Ev, Me, Re, Us>[]>
  >;
  onChannelVisible?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Channel<At, Ch, Co, Ev, Me, Re, Us>[]>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
};

export const useChannelVisible = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  onChannelVisible,
  setChannels,
}: Parameters<At, Ch, Co, Ev, Me, Re, Us>) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  useEffect(() => {
    const handleEvent = async (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (typeof onChannelVisible === 'function') {
        onChannelVisible(setChannels, event);
      } else {
        if (event.channel_id && event.channel_type) {
          const channel = await getChannel<At, Ch, Co, Ev, Me, Re, Us>({
            client,
            id: event.channel_id,
            type: event.channel_type,
          });
          setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
        }
      }
    };

    client.on('channel.visible', handleEvent);
    return () => client.off('channel.visible', handleEvent);
  }, []);
};
