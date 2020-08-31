/* eslint-disable no-underscore-dangle */
import { convertUserToRealm } from './UserMapper';
export const convertReadStatesToRealm = (channelId, r, realm) => {
  const readsArr = [];
  for (const userId in r) {
    if (r[userId] && !r[userId].user) {
      readsArr.push({
        last_read: r[userId],
        user: {
          id: userId,
        },
      });
    } else {
      readsArr.push(r[userId]);
    }
  }
  return readsArr.map((r) => convertReadStateToRealm(channelId, r, realm));
};

export const convertReadStateToRealm = (channelId, r, realm) => {
  const existingReadState = realm.objectForPrimaryKey(
    'Read',
    `${channelId}${r.user.id}`,
  );
  if (existingReadState && existingReadState.lastRead) {
    if (existingReadState.lastRead.toString() === r.last_read.toString()) {
      return existingReadState;
    }
  }

  const read = {};
  read.id = `${channelId}${r.user.id}`;
  read.lastRead = r.last_read;
  if (r.user) read.user = convertUserToRealm(r.user, realm);
  return realm.create('Read', read, true);
};

export const getReadStatesFromRealmList = (rl) => {
  const read = [];

  for (const r of rl) {
    const user = { ...r.user };
    read.push({
      last_read: r.lastRead,
      user,
    });
  }

  return read;
};
