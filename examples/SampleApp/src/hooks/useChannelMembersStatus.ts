import { useEffect, useState } from 'react';

import { useAppContext } from '../context/AppContext';
import { getUserActivityStatus } from '../utils/getUserActivityStatus';


export const useChannelMembersStatus = (channel: unknown) => {
  const watchersCount = channel.state.watcher_count;
  const memberCount = channel?.data?.member_count;

  const getStatus = () => {
    let newStatus = '';
    const isOneOnOneConversation = memberCount === 2 && channel.id?.indexOf('!members-') === 0;

    if (isOneOnOneConversation) {

      return null;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchersCount, memberCount, chatClient]);

  return status;
};
