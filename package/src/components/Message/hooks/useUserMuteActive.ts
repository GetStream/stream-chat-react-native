import { useCallback } from 'react';

import type { UserMuteResponse, UserResponse } from 'stream-chat';

import { useChatContext } from '../../../contexts';
import { useStateStore } from '../../../hooks/useStateStore';

/**
 * Whether `currentUserId` has muted `userId`, according to the given mute list.
 */
export const isUserMuted = (
  mutedUsers: UserMuteResponse[],
  currentUserId: string | undefined,
  userId: string | undefined,
) =>
  !!userId &&
  mutedUsers.some((mute) => mute.user?.id === currentUserId && mute.target?.id === userId);

/**
 * Whether the current user has muted `user`.
 *
 * Selects that one answer from `client.mutedUsersStore`, so muting or unmuting somebody else does
 * not rerender the caller.
 */
export const useUserMuteActive = (user: UserResponse | null | undefined) => {
  const { client } = useChatContext();
  const currentUserId = client?.userID;
  const userId = user?.id;

  const selector = useCallback(
    (state: { mutedUsers: UserMuteResponse[] }) => ({
      isMuted: isUserMuted(state.mutedUsers, currentUserId, userId),
    }),
    [currentUserId, userId],
  );

  return useStateStore(client?.mutedUsersStore, selector)?.isMuted ?? false;
};
