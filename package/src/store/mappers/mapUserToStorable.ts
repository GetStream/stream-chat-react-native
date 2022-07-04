import type { UserResponse } from 'stream-chat';

import type { UserRow } from '../types';

export const mapUserToStorable = (user: UserResponse): UserRow => {
  const { banned, created_at, id, last_active, online, role, updated_at, ...extraData } = user;

  return {
    banned,
    createdAt: created_at,
    extraData: JSON.stringify(extraData || {}),
    id,
    lastActive: last_active,
    online,
    role,
    updatedAt: updated_at,
  };
};
