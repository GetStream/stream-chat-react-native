import type { UserMuteResponse } from 'stream-chat';

import { useChatContext } from '../../../contexts';
import { useStateStore } from '../../../hooks/useStateStore';

const selector = (state: { mutedUsers: UserMuteResponse[] }) => ({ mutedUsers: state.mutedUsers });

/**
 * Returns the current user's muted users from `client.mutedUsersStore`, updating reactively.
 *
 * @returns The user mutes.
 */
export function useMutedUsers(): UserMuteResponse[] {
  const { client } = useChatContext();
  return useStateStore(client?.mutedUsersStore, selector)?.mutedUsers ?? [];
}
