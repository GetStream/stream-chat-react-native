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

  const messagesToUpsert = [];

  if (draft.quoted_message) {
    messagesToUpsert.push(draft.quoted_message);
  }

  if (draft.parent_message) {
    messagesToUpsert.push(draft.parent_message);
  }

  if (messagesToUpsert.length > 0) {
    const query = await upsertMessages({ execute: false, messages: messagesToUpsert });
    queries.concat(query);
  }

  if (execute) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
