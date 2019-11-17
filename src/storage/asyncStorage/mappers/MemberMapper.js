/* eslint-disable no-underscore-dangle */

import { convertUserToStorable } from './UserMapper';
import { getChannelMembersKey } from '../keys';

export const convertMembersToStorable = (members, channelId, storable) => {
  const _members = members ? Object.values(members) : [];
  const storableMembers = _members.map((m) => {
    const member = {
      user_id: m.user_id,
      user: convertUserToStorable(m.user, storable),
      is_moderator: m.is_moderator,
      invited: m.invited,
      invite_accepted_at: m.invite_accepted_at,
      invite_rejected_at: m.invite_rejected_at,
      role: m.role,
      created_at: m.created_at,
      updated_at: m.updated_at,
    };

    return member;
  });

  storable.push([
    getChannelMembersKey(channelId),
    JSON.stringify(storableMembers),
  ]);

  return getChannelMembersKey(channelId);
};
