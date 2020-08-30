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
    extraData: JSON.stringify(extraData),
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
    ...JSON.parse(u.extraData),
  };

  delete user.extraData;

  return user;
};
