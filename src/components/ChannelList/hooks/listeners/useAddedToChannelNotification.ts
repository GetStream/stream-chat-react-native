import { useEffect } from 'react';
import uniqBy from 'lodash/uniqBy';
import type {
  Channel,
  Event,
  LiteralStringForUnion,
  UnknownType,
} from 'stream-chat';

import { getChannel } from '../../utils';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

type Parameters<
  At extends UnknownType = UnknownType,
  Ch extends UnknownType = UnknownType,
  Co extends string = LiteralStringForUnion,
  Ev extends UnknownType = UnknownType,
  Me extends UnknownType = UnknownType,
  Re extends UnknownType = UnknownType,
  Us extends UnknownType = UnknownType
> = {
  setChannels: React.Dispatch<
    React.SetStateAction<Channel<At, Ch, Co, Ev, Me, Re, Us>[]>
  >;
  onAddedToChannel?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Channel<At, Ch, Co, Ev, Me, Re, Us>[]>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
};

export const useAddedToChannelNotification = <
  At extends UnknownType = UnknownType,
  Ch extends UnknownType = UnknownType,
  Co extends string = LiteralStringForUnion,
  Ev extends UnknownType = UnknownType,
  Me extends UnknownType = UnknownType,
  Re extends UnknownType = UnknownType,
  Us extends UnknownType = UnknownType
>({
  onAddedToChannel,
  setChannels,
}: Parameters<At, Ch, Co, Ev, Me, Re, Us>) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  useEffect(() => {
    const handleEvent = async (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (typeof onAddedToChannel === 'function') {
        onAddedToChannel(setChannels, event);
      } else {
        if (event.channel?.id && event.channel?.type) {
          const channel = await getChannel<At, Ch, Co, Ev, Me, Re, Us>({
            client,
            id: event.channel.id,
            type: event.channel.type,
          });
          setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
        }
      }
    };

    client.on('notification.added_to_channel', handleEvent);
    return () => client.off('notification.added_to_channel', handleEvent);
  }, []);
};
