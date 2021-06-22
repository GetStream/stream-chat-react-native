import { useEffect, useState } from 'react';

import type { Event, Mute, StreamChat } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export const useMutedUsers = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const [mutedUsers, setMutedUsers] = useState<Mute<Us>[]>(client.mutedUsers || []);

  useEffect(() => {
    const handleEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      setMutedUsers((mutes) => event.me?.mutes || mutes || []);
    };

    client.on('notification.mutes_updated', handleEvent);
    return () => client.off('notification.mutes_updated', handleEvent);
  }, [setMutedUsers]);

  return mutedUsers;
};
