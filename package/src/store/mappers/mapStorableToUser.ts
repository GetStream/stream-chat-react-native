import type { UserResponse } from 'stream-chat';

import type { TableRow } from '../types';

export const mapStorableToUser = (userRow: TableRow<'users'>): UserResponse => {
  const { banned, createdAt, extraData, id, lastActive, online, role, updatedAt } = userRow;

  return {
    banned: Boolean(banned),
    created_at: createdAt,
    id,
    last_active: lastActive,
    online: Boolean(online),
    role,
    updated_at: updatedAt,
    ...(extraData ? JSON.parse(extraData) : {}),
  };
};
