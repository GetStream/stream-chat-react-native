/* eslint-disable no-underscore-dangle */

import { getChannelConfigKey } from '../keys';

/**
 *
 * @param {*} type
 * @param {*} c
 * @param {*} storables
 */
export const convertChannelConfigToStorable = (type, c, storables) => {
  const config = {
    type,
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
    commands: c.commands,
  };

  storables[getChannelConfigKey(type)] = config;
  return getChannelConfigKey(type);
};
