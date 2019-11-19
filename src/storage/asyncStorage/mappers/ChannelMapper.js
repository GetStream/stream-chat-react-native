import { convertMessagesToStorable } from './MessageMapper';
import { convertMembersToStorable } from './MemberMapper';
import { convertReadToStorable } from './ReadMapper';
import { convertChannelConfigToStorable } from './ChannelConfigMapper';
import { getChannelKey } from '../keys';

export const convertChannelToStorable = (c, storable) => {
  const config = c.getConfig();
  const channel = {
    type: c.type,
    id: c.id,
    data: c.data,
    cid: c.cid,
    initialized: c.initialized,
    config,
  };

  channel.messages = convertMessagesToStorable(
    c.state.messages,
    c.id,
    storable,
  );
  channel.members = convertMembersToStorable(c.state.members, c.id, storable);
  channel.read = convertReadToStorable(c.state.read, c.id, storable);

  channel.config = convertChannelConfigToStorable(
    channel.type,
    config,
    storable,
  );
  storable[getChannelKey(c.id)] = channel;

  return getChannelKey(c.id);
};
