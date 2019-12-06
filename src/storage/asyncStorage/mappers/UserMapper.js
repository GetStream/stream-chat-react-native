import { getUserKey } from '../keys';

export const convertUsersToStorable = (users, storables) => {
  if (!users) return [];
  return users.map((u) => convertUserToStorable(u, storables));
};

export const convertUserToStorable = (user, storables) => {
  storables[getUserKey(user.id)] = user;
  return getUserKey(user.id);
};
