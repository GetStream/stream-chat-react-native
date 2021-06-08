import { useEffect } from 'react';

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
  onChannelHidden?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel<At, Ch, Co, Ev, Me, Re, Us>[]>>,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
};

export const useChannelHidden = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>({
  onChannelHidden,
  setChannels,
}: Parameters<At, Ch, Co, Ev, Me, Re, Us>) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  useEffect(() => {
    const handleEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (typeof onChannelHidden === 'function') {
        onChannelHidden(setChannels, event);
      } else {
        setChannels((channels) => {
          const index = channels.findIndex(
            (channel) => channel.cid === (event.cid || event.channel?.cid),
          );
          if (index >= 0) {
            channels.splice(index, 1);
          }
          return [...channels];
        });
      }
    };

    client.on('channel.hidden', handleEvent);
    return () => client.off('channel.hidden', handleEvent);
  }, []);
};
