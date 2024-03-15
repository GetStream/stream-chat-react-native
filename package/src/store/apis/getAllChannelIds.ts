import { selectChannels } from './queries/selectChannels';

import { QuickSqliteClient } from '../QuickSqliteClient';

export const getAllChannelIds = () => {
  const channels = selectChannels();

  QuickSqliteClient.logger?.('info', 'getAllChannelIds');
  return channels.map((c) => c.cid);
};
