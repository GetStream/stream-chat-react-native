import type { UserResponse } from 'stream-chat';

import { mapStorableToTimestamp } from './mapStorableToTimestamp';

import type { TableRow } from '../types';

export const mapStorableToUser = (userRow: TableRow<'users'>): UserResponse => {
  const { banned, createdAt, extraData, id, lastActive, online, role, updatedAt } = userRow;

  return {
    banned: Boolean(banned),
    created_at: mapStorableToTimestamp(createdAt) ?? 0,
    id,
    last_active: mapStorableToTimestamp(lastActive),
    online: Boolean(online),
    role: role ?? 'user',
    updated_at: mapStorableToTimestamp(updatedAt) ?? 0,
    ...(extraData ? JSON.parse(extraData) : {}),
  };
};
