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
  setForceUpdate: React.Dispatch<React.SetStateAction<number>>;
  onChannelTruncated?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Channel<At, Ch, Co, Ev, Me, Re, Us>[]>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
};

export const useChannelTruncated = <
  At extends UnknownType = UnknownType,
  Ch extends UnknownType = UnknownType,
  Co extends string = LiteralStringForUnion,
  Ev extends UnknownType = UnknownType,
  Me extends UnknownType = UnknownType,
  Re extends UnknownType = UnknownType,
  Us extends UnknownType = UnknownType
>({
  onChannelTruncated,
  setChannels,
  setForceUpdate,
}: Parameters<At, Ch, Co, Ev, Me, Re, Us>) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  useEffect(() => {
    const handleEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (typeof onChannelTruncated === 'function') {
        onChannelTruncated(setChannels, event);
      }
      setForceUpdate((count) => count + 1);
    };

    client.on('channel.truncated', handleEvent);
    return () => client.off('channel.truncated', handleEvent);
  }, []);
};
