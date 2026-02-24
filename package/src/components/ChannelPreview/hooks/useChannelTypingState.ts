import { useCallback, useEffect, useState } from 'react';

import { Channel, Event, UserResponse } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

type UseChannelTypingStateProps = {
  channel: Channel;
};

// Listen to the typing.start and typing.stop events and update the typing state
export const useChannelTypingState = ({ channel }: UseChannelTypingStateProps) => {
  const { client } = useChatContext();
  const [usersTyping, setUsersTyping] = useState<UserResponse[]>([]);

  const handleTypingStart = useCallback(
    (event: Event) => {
      if (channel.cid !== event.cid || event.user?.id === client?.user?.id) return;
      setUsersTyping((prev) => {
        if (!event.user) return prev;
        if (prev.some((user) => user.id === event.user?.id)) return prev;
        return [...prev, event.user];
      });
    },
    [channel.cid, client?.user?.id],
  );

  const handleTypingStop = useCallback(
    (event: Event) => {
      if (channel.cid !== event.cid || event.user?.id === client?.user?.id) return;
      setUsersTyping((prev) => prev.filter((user) => user.id !== event.user?.id));
    },
    [channel.cid, client?.user?.id],
  );

  useEffect(() => {
    const listeners = [
      channel.on('typing.start', handleTypingStart),
      channel.on('typing.stop', handleTypingStop),
    ];

    return () => {
      listeners.forEach((listener) => listener.unsubscribe());
    };
  }, [channel, handleTypingStart, handleTypingStop]);

  return { usersTyping };
};
