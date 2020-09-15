import { useEffect } from 'react';
import type {
  Channel,
  Event,
  LiteralStringForUnion,
  UnknownType,
} from 'stream-chat';

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
  onChannelUpdated?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Channel<At, Ch, Co, Ev, Me, Re, Us>[]>
    >,
    e: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
};

export const useChannelUpdated = <
  At extends UnknownType = UnknownType,
  Ch extends UnknownType = UnknownType,
  Co extends string = LiteralStringForUnion,
  Ev extends UnknownType = UnknownType,
  Me extends UnknownType = UnknownType,
  Re extends UnknownType = UnknownType,
  Us extends UnknownType = UnknownType
>({
  onChannelUpdated,
  setChannels,
}: Parameters<At, Ch, Co, Ev, Me, Re, Us>) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  useEffect(() => {
    const handleEvent = (e: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (typeof onChannelUpdated === 'function') {
        onChannelUpdated(setChannels, e);
      } else {
        setChannels((channels) => {
          const index = channels.findIndex(
            (c) => c.cid === (e.cid || e.channel?.cid),
          );
          if (index >= 0 && e.channel) {
            channels[index].data = e.channel;
          }
          return [...channels];
        });
      }
    };

    client.on('channel.updated', handleEvent);
    return () => client.off('channel.updated', handleEvent);
  }, []);
};
