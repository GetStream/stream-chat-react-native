import { fromPartial } from '@total-typescript/shoehorn';
import type { ReactionResponse } from 'stream-chat';

import { generateUser } from './user';

export const generateReaction = (options: Partial<ReactionResponse> = {}): ReactionResponse => {
  const user = options.user || generateUser();
  return fromPartial<ReactionResponse>({
    created_at: new Date() as unknown as string,
    type: 'love',
    user,
    user_id: user.id,
    ...options,
  });
};
