import type { UserResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { UserRow } from '../types';

export const mapStorableToUser = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  userRow: UserRow,
): UserResponse<StreamChatGenerics> => {
  const { banned, createdAt, extraData, id, lastActive, online, role, updatedAt } = userRow;

  return {
    banned,
    created_at: createdAt,
    id,
    last_active: lastActive,
    online,
    role,
    updated_at: updatedAt,
    ...JSON.parse(extraData || '{}'),
  };
};
