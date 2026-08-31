import type { UserResponse } from 'stream-chat';

import { mapStorableToDateTime } from './mapStorableToDateTime';

import type { TableRow } from '../types';

export const mapStorableToUser = (userRow: TableRow<'users'>): UserResponse => {
  const { banned, createdAt, extraData, id, lastActive, online, role, updatedAt } = userRow;

  return {
    banned: Boolean(banned),
    created_at: mapStorableToDateTime(createdAt),
    id,
    last_active: mapStorableToDateTime(lastActive),
    online: Boolean(online),
    role,
    updated_at: mapStorableToDateTime(updatedAt),
    ...(extraData ? JSON.parse(extraData) : {}),
  };
};
