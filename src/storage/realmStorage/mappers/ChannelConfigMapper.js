/* eslint-disable no-underscore-dangle */

import { convertCommandsToRealm } from './CommandMapper';

export const convertChannelConfigToRealm = (c, realm) => {
  const config = {
    name: c.name,
    typing_events: c.typing_events,
    read_events: c.read_events,
    connect_events: c.connect_events,
    reactions: c.reactions,
    replies: c.replies,
    search: c.search,
    mutes: c.mutes,
    message_retention: c.message_retention,
    max_message_length: c.max_message_length,
    uploads: c.uploads,
    automod: c.automod,
    automod_behavior: c.automod_behavior,
  };

  config.commands = convertCommandsToRealm(c.commands, realm);

  return realm.create('ChannelConfig', config, true);
};

export const getChannelConfigFromRealm = (c) => {
  const config = { ...c };

  if (config) {
    config.commands = config.commands.map((c) => ({
      name: c.name,
      description: c.description,
      args: c.args,
      set: c.set,
    }));
  }

  return config;
};
