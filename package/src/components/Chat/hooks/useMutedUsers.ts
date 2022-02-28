import { useEffect, useState } from 'react';

import type { Event, Mute, StreamChat } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useMutedUsers = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  client: StreamChat<StreamChatGenerics>,
) => {
  const [mutedUsers, setMutedUsers] = useState<Mute<StreamChatGenerics>[]>(client.mutedUsers || []);

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
      setMutedUsers((mutes) => event.me?.mutes || mutes || []);
    };

    client.on('notification.mutes_updated', handleEvent);
    return () => client.off('notification.mutes_updated', handleEvent);
  }, [setMutedUsers]);

  return mutedUsers;
};
