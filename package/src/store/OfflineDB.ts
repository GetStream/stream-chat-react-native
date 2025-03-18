import { AbstractOfflineDB, GetChannelsForQueryType, GetChannelsType } from 'stream-chat';

import * as api from './apis';

export class OfflineDB extends AbstractOfflineDB {
  upsertCidsForQuery = api.upsertCidsForQuery;
  upsertChannels = api.upsertChannels;
  // FIXME
  getChannels = ({ cids, userId }: GetChannelsType) =>
    api.getChannels({ channelIds: cids, currentUserId: userId });
  // FIXME
  getChannelsForQuery = ({ userId, filters, sort }: GetChannelsForQueryType) =>
    api.getChannelsForFilterSort({ currentUserId: userId, filters, sort });
}
