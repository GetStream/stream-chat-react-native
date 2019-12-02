import { getUserFromRealm } from './UserMapper';

/* eslint-disable no-underscore-dangle */
export const convertChannelMembersToRealm = (channelId, members, realm) =>
  members.map((m) => convertChannelMemberToRealm(channelId, m, realm));

export const convertChannelMemberToRealm = (
  channelId,
  m,
  realm,
  forceUpdate = false,
) => {
  if (!forceUpdate) {
    const existingMember = realm.objectForPrimaryKey(
      'Member',
      channelId + m.user.id,
    );
    if (existingMember && existingMember.updated_at) {
      if (existingMember.updated_at.toString() === m.updated_at.toString()) {
        return existingMember;
      }
    }
  }

  const member = {
    id: channelId + m.user.id,
    user_id: m.user.id,
    user: m.user,
    is_moderator: m.is_moderator,
    invited: m.invited,
    invite_accepted_at: m.invite_accepted_at,
    invite_rejected_at: m.invite_rejected_at,
    role: m.role,
    created_at: m.created_at,
    updated_at: m.updated_at,
  };

  member.user = realm.create('User', member.user, true);
  member.user_id = member.user.id;
  return realm.create('Member', member, true);
};

export const getMembersFromRealmList = (ml) => {
  // return [];
  const members = [];
  for (const m of ml) {
    const member = {
      id: m.id,
      user_id: m.user_id,
      user: getUserFromRealm(m.user),
      is_moderator: m.is_moderator,
      invited: m.invited,
      invite_accepted_at: m.invite_accepted_at,
      invite_rejected_at: m.invite_rejected_at,
      role: m.role,
      created_at: m.created_at,
      updated_at: m.updated_at,
    };
    members.push(member);
  }

  return members;
};
