import { useEffect, useState } from 'react';

import type { Event, ExtendableGenerics, Mute, StreamChat } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useMutedUsers = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  client: StreamChat<StreamChatClient>,
) => {
  const [mutedUsers, setMutedUsers] = useState<Mute<StreamChatClient>[]>(client.mutedUsers || []);

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatClient>) => {
      setMutedUsers((mutes) => event.me?.mutes || mutes || []);
    };

    client.on('notification.mutes_updated', handleEvent);
    return () => client.off('notification.mutes_updated', handleEvent);
  }, [setMutedUsers]);

  return mutedUsers;
};
