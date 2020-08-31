/* eslint-disable no-underscore-dangle */
export const convertUsersToRealm = (users, realm) =>
  users.map((mu) => convertUserToRealm(mu, realm));

export const convertUserToRealm = (u, realm) => {
  const {
    id,
    name,
    image,
    role,
    created_at,
    updated_at,
    last_active,
    deleted_at,
    deactivated_at,
    online,
    ...extraData
  } = u;

  const user = {
    created_at,
    deactivated_at,
    deleted_at,
    extraData: JSON.stringify(extraData),
    id,
    image,
    last_active,
    name,
    online,
    role,
    updated_at,
  };

  return realm.create('User', user, true);
};

export const getUsersFromRealmList = (uList) => {
  const users = [];
  for (const u of uList) {
    users.push(getUserFromRealm(u));
  }

  return users;
};

export const getUserFromRealm = (u) => {
  const user = {
    created_at: u.created_at,
    deactivated_at: u.deactivated_at,
    deleted_at: u.deleted_at,
    id: u.id,
    image: u.image,
    last_active: u.last_active,
    name: u.name,
    online: u.online,
    role: u.role,
    updated_at: u.updated_at,
    ...JSON.parse(u.extraData),
  };

  delete user.extraData;

  return user;
};
