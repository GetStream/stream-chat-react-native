import type { UserResponse } from 'stream-chat';

import { mapTimestampToStorable } from './mapTimestampToStorable';

import type { TableRow } from '../types';

export const mapUserToStorable = (user: UserResponse): TableRow<'users'> => {
  const { banned, created_at, id, last_active, online, role, updated_at, ...extraData } = user;

  return {
    banned,
    createdAt: mapTimestampToStorable(created_at),
    extraData: JSON.stringify(extraData || {}),
    id,
    lastActive: mapTimestampToStorable(last_active),
    online,
    role,
    updatedAt: mapTimestampToStorable(updated_at),
  };
};
