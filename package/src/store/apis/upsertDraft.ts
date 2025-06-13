import { DraftResponse } from 'stream-chat';

import { upsertMessages } from './upsertMessages';

import { mapDraftMessageToStorable } from '../mappers/mapDraftMessageToStorable';
import { mapDraftToStorable } from '../mappers/mapDraftToStorable';
import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';
import type { PreparedQueries } from '../types';

export const upsertDraft = async ({
  execute = true,
  draft,
}: {
  draft: DraftResponse;
  execute?: boolean;
}) => {
  const queries: PreparedQueries[] = [];
  const { channel_cid, parent_id, message } = draft;

  // Delete existing draft message if it exists.
  const deleteQuery = createDeleteQuery('draft', {
    cid: channel_cid,
    parentId: parent_id,
  });

  queries.push(deleteQuery);

  // Important: Make sure you create a draft only after a draft message is created.
  const storableDraftMessage = mapDraftMessageToStorable({ draftMessage: message });

  queries.push(createUpsertQuery('draftMessage', storableDraftMessage));

  const storableDraft = mapDraftToStorable({ draft });

  queries.push(createUpsertQuery('draft', storableDraft));

  SqliteClient.logger?.('info', 'upsertDraft', {
    draftMessage: storableDraftMessage,
  });

  if (draft.quoted_message) {
    const query = await upsertMessages({ execute: false, messages: [draft.quoted_message] });
    queries.concat(query);
  }

  if (execute) {
    try {
      await SqliteClient.executeSqlBatch(queries);
    } catch (error) {
      console.error(error);
    }
  }

  return queries;
};
