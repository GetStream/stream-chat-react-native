import type { UserResponse } from 'stream-chat';

import { mapStorableToTimestamp } from './mapStorableToTimestamp';

import type { TableRow } from '../types';

export const mapStorableToUser = (userRow: TableRow<'users'>): UserResponse => {
  const { banned, createdAt, extraData, id, lastActive, online, role, updatedAt } = userRow;

  return {
    banned: Boolean(banned),
    created_at: mapStorableToTimestamp(createdAt),
    id,
    last_active: mapStorableToTimestamp(lastActive),
    online: Boolean(online),
    role,
    updated_at: mapStorableToTimestamp(updatedAt),
    ...(extraData ? JSON.parse(extraData) : {}),
  };
};
