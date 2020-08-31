/* eslint-disable no-underscore-dangle */
import { convertMessagesToRealm } from './MessageMapper';
import { convertChannelMembersToRealm } from './MemberMapper';
import { convertChannelConfigToRealm } from './ChannelConfigMapper';
import { convertReadStatesToRealm } from './ReadMapper';
import { isValidDate } from '../../../utils/utils';

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
    cid: channel.cid,
    config: channel.config,
    data: JSON.stringify(channel.data),
    id: channel.id,
    initialized: channel.initialized,
    type: channel.type,
  };
  const newMessages = convertMessagesToRealm(stateMessages, realm);

  offlineChannel.messages = newMessages;

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

  if (isValidDate(channel.data.last_message_at)) {
    offlineChannel.last_message_at = channel.data.last_message_at;
  }

  return realm.create('Channel', offlineChannel, true);
};
