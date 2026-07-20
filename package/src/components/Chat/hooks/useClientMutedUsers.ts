import type { Mute, StreamChat } from 'stream-chat';

import { useStateStore } from '../../../hooks/useStateStore';

const selector = (state: { mutedUsers: Mute[] }) => ({ mutedUsers: state.mutedUsers });

/**
 * Returns the client's muted users, sourced reactively from `client.mutedUsersStore`.
 */
export const useClientMutedUsers = (client: StreamChat): Mute[] =>
  useStateStore(client?.mutedUsersStore, selector)?.mutedUsers ?? [];
