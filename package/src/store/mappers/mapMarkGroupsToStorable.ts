import type { LocalMessage, MessageResponse } from 'stream-chat';

import { mapMessageMarkToStorable } from './mapMessageMarkToStorable';

import type { TableRow } from '../types';

/**
 * The marks a message carries, as `messageMarks` rows. `mark_groups` holds, per mark type, the
 * newest markers of the current user's own message (up to 100), enough to open its mark list.
 */
export const mapMarkGroupsToStorable = (
  message: MessageResponse | LocalMessage,
): TableRow<'messageMarks'>[] =>
  Object.entries(message.mark_groups ?? {}).flatMap(([type, group]) =>
    (group?.latest_by ?? []).map((marker) =>
      mapMessageMarkToStorable({
        created_at: marker.created_at,
        message_id: message.id,
        type,
        user_id: marker.user_id,
      }),
    ),
  );
