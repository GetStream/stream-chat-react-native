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
    created_at: m.created_at,
    id: channelId + m.user.id,
    invite_accepted_at: m.invite_accepted_at,
    invite_rejected_at: m.invite_rejected_at,
    invited: m.invited,
    is_moderator: m.is_moderator,
    role: m.role,
    updated_at: m.updated_at,
    user: m.user,
    user_id: m.user.id,
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
      created_at: m.created_at,
      id: m.id,
      invite_accepted_at: m.invite_accepted_at,
      invite_rejected_at: m.invite_rejected_at,
      invited: m.invited,
      is_moderator: m.is_moderator,
      role: m.role,
      updated_at: m.updated_at,
      user: getUserFromRealm(m.user),
      user_id: m.user_id,
    };
    members.push(member);
  }

  return members;
};
