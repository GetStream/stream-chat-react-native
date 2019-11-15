/* eslint-disable no-underscore-dangle */
export const convertMentionedUsersToRealm = (mentioned_users, realm) =>
  mentioned_users.map((mu) => convertUserToRealm(mu, realm));

export const convertUserToRealm = (u, realm) => {
  const user = {
    id: u.id,
    name: u.name,
    image: u.image,
    role: u.role,
    created_at: u.created_at,
    updated_at: u.updated_at,
    last_active: u.last_active,
    deleted_at: u.deleted_at,
    deactivated_at: u.deactivated_at,
    online: u.online,
  };

  return realm.create('User', user, true);
};

export const getMentionedUsersFromRealmList = (muList) => {
  const mentionedUsers = [];
  for (const mu of muList) {
    mentionedUsers.push(mu);
  }

  return mentionedUsers;
};
