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
  onRemovedFromChannel?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Channel<At, Ch, Co, Ev, Me, Re, Us>[]>
    >,
    e: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
};

export const useRemovedFromChannelNotification = <
  At extends UnknownType = UnknownType,
  Ch extends UnknownType = UnknownType,
  Co extends string = LiteralStringForUnion,
  Ev extends UnknownType = UnknownType,
  Me extends UnknownType = UnknownType,
  Re extends UnknownType = UnknownType,
  Us extends UnknownType = UnknownType
>({
  onRemovedFromChannel,
  setChannels,
}: Parameters<At, Ch, Co, Ev, Me, Re, Us>) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  useEffect(() => {
    const handleEvent = (e: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
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
