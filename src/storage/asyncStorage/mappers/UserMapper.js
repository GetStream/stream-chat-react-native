import { getUserKey } from '../keys';

export const convertUsersToStorable = (users, storables, appUserId) => {
  if (!users) return [];
  return users.map((u) => convertUserToStorable(u.id, u, storables, appUserId));
};

export const convertUserToStorable = (userId, user, storables, appUserId) => {
  const userKey = getUserKey(appUserId, userId);
  if (
    user === null &&
    Object.prototype.hasOwnProperty.call(storables, userKey)
  ) {
    return userKey;
  }

  storables[getUserKey(appUserId, userId)] = user;
  return getUserKey(appUserId, userId);
};
