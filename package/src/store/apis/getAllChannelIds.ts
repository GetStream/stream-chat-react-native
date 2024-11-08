import { selectChannels } from './queries/selectChannels';

import { SqliteClient } from '../SqliteClient';

export const getAllChannelIds = async () => {
  const channels = await selectChannels();

  SqliteClient.logger?.('info', 'getAllChannelIds');
  return channels.map((c) => c.cid);
};
