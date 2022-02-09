import { useEffect, useState } from 'react';

import { useAppContext } from '../context/AppContext';
import { getUserActivityStatus } from '../utils/getUserActivityStatus';

import type { Channel } from 'stream-chat';

import type { StreamChatType } from '../types';

export const useChannelMembersStatus = (channel: Channel<StreamChatType>) => {
  const watchersCount = channel.state.watcher_count;
  const memberCount = channel?.data?.member_count;

  const getStatus = () => {
    let newStatus = '';
    const isOneOnOneConversation = memberCount === 2 && channel.id?.indexOf('!members-') === 0;

    if (isOneOnOneConversation) {
      const result = Object.values({ ...channel.state.members }).find(
        (member) => member.user?.id !== chatClient?.user?.id,
      );

      return (newStatus = getUserActivityStatus(result?.user));
    } else {
      const memberCountText = `${memberCount} Members`;
      const onlineCountText = watchersCount > 0 ? `${watchersCount} Online` : '';

      newStatus = `${[memberCountText, onlineCountText].join(',')}`;

      return newStatus;
    }
  };

  const [status, setStatus] = useState(getStatus());
  const { chatClient } = useAppContext();

  useEffect(() => {
    setStatus(getStatus());
  }, [watchersCount, memberCount, chatClient]);

  return status;
};
