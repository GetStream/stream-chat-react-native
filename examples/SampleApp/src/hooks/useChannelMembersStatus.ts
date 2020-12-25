import { Channel, UserResponse } from 'stream-chat';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
} from '../types';
import Dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';

export const useChannelMembersStatus = (
  channel: Channel<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalReactionType,
    LocalUserType
  >,
) => {
  const [status, setStatus] = useState('');
  const { chatClient } = useContext(AppContext);

  useEffect(() => {
    let newStatus = '';
    const isOneOnOneConversation =
      Object.values(channel.state.members).length === 2 &&
      channel.id?.indexOf('!members-') === 0;

    if (isOneOnOneConversation) {
      const { user } = Object.values(channel.state.members).find(
        (m) => m.user?.id !== chatClient?.user?.id,
      );

      newStatus = getUserActivityStatus(user);
    } else {
      const watchersCount = channel.state.watcher_count;
      const memberCount = channel?.data?.member_count;

      const memberCountText = `${memberCount} Members`;
      const onlineCountText =
        watchersCount > 0 ? `${watchersCount} Online` : '';

      newStatus = `${[memberCountText, onlineCountText].join(',')}`;
    }

    setStatus(newStatus);
  }, [channel, chatClient]);

  return status;
};

export const getUserActivityStatus = (user: UserResponse<LocalUserType>) => {
  if (Dayjs(user.last_active).isBefore(Dayjs())) {
    return `Last seen ${Dayjs(user?.last_active).fromNow()}`;
  }

  if (user.online) {
    return `Online for ${Dayjs(user?.last_active).toNow()}`;
  }

  return '';
};
