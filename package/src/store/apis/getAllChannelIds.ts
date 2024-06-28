import { selectChannels } from './queries/selectChannels';

import { SqliteClient } from '../SqliteClient';

export const getAllChannelIds = () => {
  const channels = selectChannels();

  SqliteClient.logger?.('info', 'getAllChannelIds');
  return channels.map((c) => c.cid);
};
