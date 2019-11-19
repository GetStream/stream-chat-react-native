/* eslint-disable no-underscore-dangle */
import { convertMessagesToRealm } from './MessageMapper';
import { convertChannelMembersToRealm } from './MemberMapper';
import { convertChannelConfigToRealm } from './ChannelConfigMapper';
import { convertReadStatesToRealm } from './ReadMapper';

export const convertChannelToRealm = (channel, realm) => {
  const config = channel.getConfig();
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
    config,
  };

  offlineChannel.messages = convertMessagesToRealm(stateMessages, realm);

  offlineChannel.members = convertChannelMembersToRealm(
    offlineChannel.id,
    stateMembers,
    realm,
  );

  offlineChannel.config = convertChannelConfigToRealm(
    channel.type,
    config,
    realm,
  );
  offlineChannel.read = convertReadStatesToRealm(
    offlineChannel.id,
    channel.state.read,
    realm,
  );
  return realm.create('Channel', offlineChannel, true);
};
