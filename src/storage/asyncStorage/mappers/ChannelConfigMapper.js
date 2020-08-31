/* eslint-disable no-underscore-dangle */

import { getChannelConfigKey } from '../keys';

/**
 *
 * @param {*} type
 * @param {*} c
 * @param {*} storables
 */
export const convertChannelConfigToStorable = (
  type,
  c,
  storables,
  appUserId,
) => {
  const config = {
    automod: c.automod,
    automod_behavior: c.automod_behavior,
    commands: c.commands,
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

  storables[getChannelConfigKey(appUserId, type)] = config;
  return getChannelConfigKey(appUserId, type);
};
