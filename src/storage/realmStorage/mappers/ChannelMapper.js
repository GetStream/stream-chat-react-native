/* eslint-disable no-underscore-dangle */
import { convertMessagesToRealm } from './MessageMapper';
import { convertChannelMembersToRealm } from './MemberMapper';
import { convertChannelConfigToRealm } from './ChannelConfigMapper';
import { convertReadStatesToRealm } from './ReadMapper';
function isValidDate(d) {
  let date = d;

  if (typeof d === 'string') {
    date = new Date(d);
  }

  return date instanceof Date && !isNaN(date);
}

export const convertChannelToRealm = (channel, realm) => {
  let isUpdated = true;
  const existingChannel = realm.objectForPrimaryKey('Channel', channel.id);
  if (existingChannel && existingChannel.updated_at) {
    if (
      existingChannel.updated_at.toString() ===
      channel.data.updated_at.toString()
    ) {
      isUpdated = false;
    }
  }

  const stateMembers = channel.state.members
    ? Object.values(channel.state.members)
    : [];
  const stateMessages = channel.state.messages
    ? [...channel.state.messages]
    : [];
  const offlineChannel = {
    type: channel.type,
    id: channel.id,
    data: JSON.stringify(channel.data),
    cid: channel.cid,
    initialized: channel.initialized,
    config: channel.config,
  };
  const newMessages = convertMessagesToRealm(stateMessages, realm);

  const rChannel = realm.objectForPrimaryKey('Channel', channel.id);
  if (rChannel) offlineChannel.messages = rChannel.messages;
  else offlineChannel.messages = newMessages;

  if (isUpdated) {
    offlineChannel.members = convertChannelMembersToRealm(
      offlineChannel.id,
      stateMembers,
      realm,
    );
  }

  offlineChannel.config = convertChannelConfigToRealm(
    channel.type,
    channel.config,
    realm,
  );

  offlineChannel.read = convertReadStatesToRealm(
    offlineChannel.id,
    channel.state.read,
    realm,
  );

  if (isValidDate(channel.data.updated_at)) {
    offlineChannel.updated_at = channel.data.updated_at;
  }

  if (isValidDate(channel.data.created_at)) {
    offlineChannel.deleted_at = channel.data.deleted_at;
  }

  return realm.create('Channel', offlineChannel, true);
};
