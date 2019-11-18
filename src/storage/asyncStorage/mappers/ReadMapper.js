import { convertUserToStorable } from './UserMapper';
import { getChannelReadKey } from '../keys';

export const convertReadToStorable = (reads, channelId, storables) => {
  const storableReadState = {};
  for (const userId in reads) {
    storableReadState[userId] = {
      last_read: reads[userId].last_read,
      user: convertUserToStorable(reads[userId].user, storables),
    };
  }

  // Reactotron.log('Storing read', channelId, storableReadState);

  storables[getChannelReadKey(channelId)] = storableReadState;

  return getChannelReadKey(channelId);
};
