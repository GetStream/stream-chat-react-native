import { UserResponse } from 'stream-chat';

import { useChatContext } from '../../../contexts';
import { useMutedUsers } from '../../ChannelList/hooks/useMutedUsers';

export const useUserMuteActive = (user: UserResponse | null | undefined) => {
  const { client } = useChatContext();
  const mutedUsers = useMutedUsers();

  if (!user) {
    return false;
  }

  return !!mutedUsers.find((mute) => mute.user.id === client.userID && user.id === mute.target.id);
};
