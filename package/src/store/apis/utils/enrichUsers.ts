import { mapStorableToUser } from '../../mappers/mapStorableToUser';
import type { UserRow } from '../../types';

export const enrichUsers = (obj: any[] | Record<string, any>, users: Record<string, UserRow>) => {
  if (Array.isArray(obj)) {
    obj.forEach((p) => enrichUsers(p, users));
    return;
  }

  for (const i in obj) {
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(i)) {
      if (i === 'userId') {
        obj.user = { ...mapStorableToUser(users[obj.userId]) };
        delete obj.userId;
        continue;
      }
      if (i === 'user_id') {
        obj.user = { ...mapStorableToUser(users[obj.user_id]) };
        delete obj.user_id;
        continue;
      }

      if (Array.isArray(obj[i])) {
        obj[i].forEach((p) => enrichUsers(p, users));
        continue;
      }
      if (typeof obj[i] === 'object') {
        enrichUsers(obj[i], users);
      }
    }
  }
};
