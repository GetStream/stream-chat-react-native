import type { Mute } from 'stream-chat';

import { useChatContext } from '../../../contexts';
import { useStateStore } from '../../../hooks/useStateStore';

const selector = (state: { mutedUsers: Mute[] }) => ({ mutedUsers: state.mutedUsers });

/**
 * Returns the current user's muted users, sourced reactively from `client.mutedUsersStore`.
 */
export function useMutedUsers(): Mute[] {
  const { client } = useChatContext();
  return useStateStore(client?.mutedUsersStore, selector)?.mutedUsers ?? [];
}
