import { createSelectQuery } from '../../sqlite-utils/createSelectQuery';
import { SqliteClient } from '../../SqliteClient';
import type { TableRowJoinedUser } from '../../types';

export const selectChannels = async ({ channelIds }: { channelIds?: string[] } = {}): Promise<
  TableRowJoinedUser<'channels'>[]
> => {
  const query = createSelectQuery(
    'channels',
    ['*'],
    channelIds
      ? {
          cid: channelIds,
        }
      : undefined,
  );

  SqliteClient.logger?.('info', 'selectChannels', {
    channelIds,
  });

  const result = (await SqliteClient.executeSql.apply(
    null,
    query,
  )) as unknown as TableRowJoinedUser<'channels'>[];

  if (channelIds) {
    return result.sort(
      (a: { cid: string }, b: { cid: string }) =>
        channelIds.indexOf(a.cid) - channelIds.indexOf(b.cid),
    );
  } else {
    return result;
  }
};
