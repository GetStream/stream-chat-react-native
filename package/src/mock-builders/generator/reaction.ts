import { fromPartial } from '@total-typescript/shoehorn';
import type { ReactionResponse } from 'stream-chat';

import { convertDateToTimestamp } from './time';
import { generateUser } from './user';

export const generateReaction = (options: Partial<ReactionResponse> = {}): ReactionResponse => {
  const user = options.user || generateUser();
  return fromPartial<ReactionResponse>({
    created_at: convertDateToTimestamp(),
    type: 'love',
    user,
    user_id: user.id,
    ...options,
  });
};
