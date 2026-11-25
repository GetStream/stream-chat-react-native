import type { LocalMessage, MessageResponse } from 'stream-chat';

import { mapMarkGroupsToStorable } from '../mappers/mapMarkGroupsToStorable';
import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapPollToStorable } from '../mappers/mapPollToStorable';
import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { mapReminderToStorable } from '../mappers/mapReminderToStorable';
import { mapSharedLocationToStorable } from '../mappers/mapSharedLocationToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

export const upsertMessages = async ({
  execute = true,
  messages,
}: {
  messages: (MessageResponse | LocalMessage)[];
  execute?: boolean;
}) => {
  const storableMessages: Array<ReturnType<typeof mapMessageToStorable>> = [];
  const storableUsers: Array<ReturnType<typeof mapUserToStorable>> = [];
  const storableReactions: Array<ReturnType<typeof mapReactionToStorable>> = [];
  const storablePolls: Array<ReturnType<typeof mapPollToStorable>> = [];
  const storableReminders: Array<ReturnType<typeof mapReminderToStorable>> = [];
  const storableLocations: Array<ReturnType<typeof mapSharedLocationToStorable>> = [];
  const storableMarks: ReturnType<typeof mapMarkGroupsToStorable> = [];

  messages?.forEach((message: MessageResponse | LocalMessage) => {
    if (message.parent_id && !message.show_in_channel) {
      return;
    }
    storableMessages.push(mapMessageToStorable(message));
    storableMarks.push(...mapMarkGroupsToStorable(message));
    if (message.user) {
      storableUsers.push(mapUserToStorable(message.user));
    }
    [...(message.latest_reactions || []), ...(message.own_reactions || [])].forEach((r) => {
      if (r.user) {
        storableUsers.push(mapUserToStorable(r.user));
      }
      storableReactions.push(mapReactionToStorable(r));
    });
    if (message.poll) {
      storablePolls.push(mapPollToStorable(message.poll));
    }
    if (message.reminder) {
      storableReminders.push(mapReminderToStorable(message.reminder));
    }
    if (message.shared_location) {
      storableLocations.push(mapSharedLocationToStorable(message.shared_location));
    }
  });

  const finalQueries = [
    ...storableMessages.map((storableMessage) => createUpsertQuery('messages', storableMessage)),
    ...storableUsers.map((storableUser) => createUpsertQuery('users', storableUser)),
    ...storableReactions.map((storableReaction) =>
      createUpsertQuery('reactions', storableReaction),
    ),
    ...storablePolls.map((storablePoll) => createUpsertQuery('poll', storablePoll)),
    ...storableReminders.map((storableReminder) =>
      createUpsertQuery('reminders', storableReminder),
    ),
    ...storableLocations.map((storableLocation) =>
      createUpsertQuery('locations', storableLocation),
    ),
    ...storableMarks.map((storableMark) => createUpsertQuery('messageMarks', storableMark)),
  ];

  SqliteClient.logger?.('info', 'upsertMessages', {
    execute,
    locations: storableLocations,
    marks: storableMarks,
    messages: storableMessages,
    polls: storablePolls,
    reactions: storableReactions,
    reminders: storableReminders,
    users: storableUsers,
  });

  if (execute) {
    await SqliteClient.executeSqlBatch(finalQueries);
  }

  return finalQueries;
};
