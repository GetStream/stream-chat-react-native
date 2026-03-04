import { UserResponse } from 'stream-chat';

import { useChannelContext, useChatContext } from '../../../contexts';
import { useMutedUsers } from '../../ChannelList/hooks/useMutedUsers';

export const useUserMuteActive = (user: UserResponse | null | undefined) => {
  const { client } = useChatContext();
  const { channel } = useChannelContext();
  const mutedUsers = useMutedUsers(channel);

  if (!user) {
    return false;
  }

  return !!mutedUsers.find((mute) => mute.user.id === client.userID && user.id === mute.target.id);
};
