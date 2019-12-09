/* eslint-disable no-underscore-dangle */

import { convertUserToStorable } from './UserMapper';
import { getChannelMembersKey } from '../keys';

export const convertMembersToStorable = (
  members,
  channelId,
  storable,
  appUserId,
) => {
  const _members = members ? Object.values(members) : [];
  const storableMembers = _members.map((m) => {
    const member = {
      user_id: m.user_id,
      user: convertUserToStorable(m.user, storable, appUserId),
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

  storable[getChannelMembersKey(appUserId, channelId)] = storableMembers;

  return getChannelMembersKey(appUserId, channelId);
};
