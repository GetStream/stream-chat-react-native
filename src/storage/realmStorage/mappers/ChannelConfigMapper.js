/* eslint-disable no-underscore-dangle */

import { convertCommandsToRealm } from './CommandMapper';

/**
 *
 * @param {*} type Channel type
 * @param {*} c Config
 * @param {*} realm
 */
export const convertChannelConfigToRealm = (type, c, realm) => {
  const config = {
    automod: c.automod,
    automod_behavior: c.automod_behavior,
    connect_events: c.connect_events,
    max_message_length: c.max_message_length,
    message_retention: c.message_retention,
    mutes: c.mutes,
    name: c.name,
    reactions: c.reactions,
    read_events: c.read_events,
    replies: c.replies,
    search: c.search,
    type,
    typing_events: c.typing_events,
    uploads: c.uploads,
  };

  config.commands = convertCommandsToRealm(c.commands, realm);

  return realm.create('ChannelConfig', config, true);
};

export const getChannelConfigFromRealm = (c) => {
  const config = { ...c };

  if (config) {
    config.commands = config.commands.map((c) => ({
      args: c.args,
      description: c.description,
      name: c.name,
      set: c.set,
    }));
  }

  return config;
};
