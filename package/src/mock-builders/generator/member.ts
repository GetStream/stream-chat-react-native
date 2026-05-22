import { fromPartial } from '@total-typescript/shoehorn';
import type { ChannelMemberResponse } from 'stream-chat';

import { generateUser } from './user';

export const generateMember = (
  options: Partial<ChannelMemberResponse> = {},
): ChannelMemberResponse => {
  const user = (options && options.user) || generateUser();
  return fromPartial<ChannelMemberResponse>({
    invited: false,
    is_moderator: false,
    role: 'member',
    user,
    user_id: user.id,
    ...options,
  });
};
