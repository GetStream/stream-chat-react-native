import { useCallback } from 'react';

import type { UserMuteResponse, UserResponse } from 'stream-chat';

import { useChatContext } from '../../../contexts';
import { useStateStore } from '../../../hooks/useStateStore';

/**
 * Whether `currentUserId` has muted `userId`, according to the given mute list.
 *
 * @param mutedUsers The mute list to search.
 * @param currentUserId ID of the user who may have muted.
 * @param userId ID of the user who may be muted.
 * @returns Whether `currentUserId` has muted `userId`.
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
 * not re-render the caller.
 *
 * @param user The user to check.
 * @returns Whether the current user has muted `user`.
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
