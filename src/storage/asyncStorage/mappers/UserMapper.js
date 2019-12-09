import { getUserKey } from '../keys';

export const convertUsersToStorable = (users, storables, appUserId) => {
  if (!users) return [];
  return users.map((u) => convertUserToStorable(u, storables, appUserId));
};

export const convertUserToStorable = (user, storables, appUserId) => {
  storables[getUserKey(appUserId, user.id)] = user;
  return getUserKey(appUserId, user.id);
};
