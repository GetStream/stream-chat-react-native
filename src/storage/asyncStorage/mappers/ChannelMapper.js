import { convertMessagesToStorable } from './MessageMapper';
import { convertMembersToStorable } from './MemberMapper';
import { convertReadToStorable } from './ReadMapper';
import { convertChannelConfigToStorable } from './ChannelConfigMapper';
import { getChannelKey } from '../keys';

export const convertChannelToStorable = (c, storable, appUserId) => {
  const channel = {
    type: c.type,
    id: c.id,
    data: c.data,
    created_at: c.data.created_at,
    updated_at: c.data.updated_at,
    last_message_at: c.data.last_message_at,
    cid: c.cid,
    initialized: c.initialized,
    config: c.config,
  };

  const { members, ...customData } = c.data;
  channel.data = customData;
  channel.messages = convertMessagesToStorable(
    c.state.messages,
    c.id,
    storable,
    appUserId,
  );
  channel.members = convertMembersToStorable(
    c.state.members,
    c.id,
    storable,
    appUserId,
  );
  channel.read = convertReadToStorable(c.state.read, c.id, storable, appUserId);

  channel.config = convertChannelConfigToStorable(
    channel.type,
    channel.config,
    storable,
    appUserId,
  );
  storable[getChannelKey(appUserId, c.id)] = channel;

  return getChannelKey(appUserId, c.id);
};
