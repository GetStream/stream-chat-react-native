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
    const user = {
      ...u,
      ...JSON.parse(u.extraData),
    };

    delete user.extraData;
    users.push(user);
  }

  return users;
};
