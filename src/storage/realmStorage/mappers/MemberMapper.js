/* eslint-disable no-underscore-dangle */
export const convertChannelMembersToRealm = (members, realm) =>
  members.map((m) => {
    const member = {
      user_id: m.user_id,
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
  });
