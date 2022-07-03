import type { JoinedChannelRow } from '../../types';

import { selectQuery } from '../../utils/selectQuery';

export const selectChannelsForChannelIds = ({
  channelIds,
}: {
  channelIds: string[];
}): JoinedChannelRow[] => {
  const questionMarks = Array(channelIds.length).fill('?').join(',');
  const result = selectQuery(
    `SELECT * FROM channels WHERE cid IN (${questionMarks})`,
    [...channelIds],
    'query channels for channel ids',
  );

  return result.sort((a, b) => channelIds.indexOf(a.cid) - channelIds.indexOf(b.cid));
};
