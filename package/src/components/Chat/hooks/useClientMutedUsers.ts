import type { StreamChat, UserMuteResponse } from 'stream-chat';

import { useStateStore } from '../../../hooks/useStateStore';

const selector = (state: { mutedUsers: UserMuteResponse[] }) => ({ mutedUsers: state.mutedUsers });

/**
 * Returns the client's muted users, sourced reactively from `client.mutedUsersStore`.
 */
export const useClientMutedUsers = (client: StreamChat): UserMuteResponse[] =>
  useStateStore(client?.mutedUsersStore, selector)?.mutedUsers ?? [];
