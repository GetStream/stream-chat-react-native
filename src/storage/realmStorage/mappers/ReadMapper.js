/* eslint-disable no-underscore-dangle */

export const convertReadStatesToRealm = (channelId, r, realm) => {
  const stateReads = r ? Object.values(r) : [];

  return stateReads.map((r) => convertReadStateToRealm(channelId, r, realm));
};

export const convertReadStateToRealm = (channelId, r, realm) => {
  const read = {};
  read.id = `${channelId}${r.user.id}`;
  read.lastRead = r.last_read;
  read.user = realm.create('User', r.user, true);
  return realm.create('Read', read, true);
};

export const getReadStatesFromRealmList = (rl) => {
  const read = [];

  for (const r of rl) {
    const user = { ...r.user };
    read.push({
      user,
      last_read: r.lastRead,
    });
  }

  return read;
};
