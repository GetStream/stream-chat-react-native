import { useEffect, useState } from 'react';

import type { Event, Mute, StreamChat } from 'stream-chat';

export const useMutedUsers = (client: StreamChat) => {
  const [mutedUsers, setMutedUsers] = useState<Mute[]>(client?.mutedUsers || []);

  useEffect(() => {
    const handleEvent = (event: Event) => {
      setMutedUsers((mutes) => event.me?.mutes || mutes || []);
    };

    const listener = client?.on('notification.mutes_updated', handleEvent);
    return () => listener?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setMutedUsers]);

  return mutedUsers;
};
