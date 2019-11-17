import { getUserKey } from '../keys';

export const convertUsersToStorable = (users, storables) =>
  users.map((u) => convertUserToStorable(u, storables));

export const convertUserToStorable = (user, storables) => {
  storables.push([getUserKey(user.id), JSON.stringify(user)]);
  return getUserKey(user.id);
};
