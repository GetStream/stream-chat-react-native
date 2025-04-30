import type { Event, StreamChat } from 'stream-chat';

import { deleteChannel } from '../../../store/apis/deleteChannel';
// import { deleteMember } from '../../../store/apis/deleteMember';
import { deleteMessagesForChannel } from '../../../store/apis/deleteMessagesForChannel';
// import { updateMessage } from '../../../store/apis/updateMessage';
import { upsertChannelData } from '../../../store/apis/upsertChannelData';
// import { upsertChannelDataFromChannel } from '../../../store/apis/upsertChannelDataFromChannel';
// import { upsertMembers } from '../../../store/apis/upsertMembers';
// import { upsertReads } from '../../../store/apis/upsertReads';
// import { createSelectQuery } from '../../../store/sqlite-utils/createSelectQuery';
// import { SqliteClient } from '../../../store/SqliteClient';
// import { PreparedQueries } from '../../../store/types';

export const handleEventToSyncDB = async (event: Event, client: StreamChat, flush?: boolean) => {
  const { type } = event;
  console.log('client', !!client);

  // This function is used to guard the queries that require channel to be present in the db first
  // If channel is not present in the db, we first fetch the channel data from the channel object
  // and then add the queries with a channel create query first
  // const queriesWithChannelGuard = async (
  //   createQueries: (flushOverride?: boolean) => Promise<PreparedQueries[]>,
  // ) => {
  //   const cid = event.cid || event.channel?.cid;
  //
  //   if (!cid) {
  //     return await createQueries(flush);
  //   }
  //   const channels = await SqliteClient.executeSql.apply(
  //     null,
  //     createSelectQuery('channels', ['cid'], {
  //       cid,
  //     }),
  //   );
  //   // a channel is not present in the db, we first fetch the channel data from the channel object.
  //   // this can happen for example when a message.new event is received for a channel that is not in the db due to a channel being hidden.
  //   if (channels.length === 0) {
  //     const channel =
  //       event.channel_type && event.channel_id
  //         ? client.channel(event.channel_type, event.channel_id)
  //         : undefined;
  //     if (channel && channel.initialized && !channel.disconnected) {
  //       const channelQuery = await upsertChannelDataFromChannel({
  //         channel,
  //         flush,
  //       });
  //       if (channelQuery) {
  //         const createdQueries = await createQueries(false);
  //         const newQueries = [...channelQuery, ...createdQueries];
  //         if (flush !== false) {
  //           await SqliteClient.executeSqlBatch(newQueries);
  //         }
  //         return newQueries;
  //       } else {
  //         console.warn(
  //           `Couldnt create channel queries on ${type} event for an initialized channel that is not in DB, skipping event`,
  //           { event },
  //         );
  //         return [];
  //       }
  //     } else {
  //       console.warn(
  //         `Received ${type} event for a non initialized channel that is not in DB, skipping event`,
  //         { event },
  //       );
  //       return [];
  //     }
  //   }
  //   return createQueries(flush);
  // };

  // if (type === 'message.read' || type === 'notification.mark_read') {
  //   const cid = event.cid;
  //   const user = event.user;
  //   if (user?.id && cid) {
  //     return await queriesWithChannelGuard((flushOverride) =>
  //       upsertReads({
  //         cid,
  //         flush: flushOverride,
  //         reads: [
  //           {
  //             last_read: event.received_at as string,
  //             last_read_message_id: event.last_read_message_id,
  //             unread_messages: 0,
  //             user,
  //           },
  //         ],
  //       }),
  //     );
  //   }
  // }

  // if (type === 'notification.mark_unread') {
  //   const cid = event.cid;
  //   const user = event.user;
  //   if (user?.id && cid) {
  //     return await queriesWithChannelGuard((flushOverride) =>
  //       upsertReads({
  //         cid,
  //         flush: flushOverride,
  //         reads: [
  //           {
  //             last_read: event.received_at as string,
  //             last_read_message_id: event.last_read_message_id,
  //             unread_messages: event.unread_messages,
  //             user,
  //           },
  //         ],
  //       }),
  //     );
  //   }
  // }

  // if (type === 'message.new') {
  //   const { cid, message, user } = event;
  //
  //   if (message && (!message.parent_id || message.show_in_channel)) {
  //     return await queriesWithChannelGuard(async (flushOverride) => {
  //       let queries = await upsertMessages({
  //         flush: flushOverride,
  //         messages: [message],
  //       });
  //       if (cid && client.user && client.user.id !== user?.id) {
  //         const userId = client.user.id;
  //         const channel = client.activeChannels[cid];
  //         if (channel) {
  //           const ownReads = channel.state.read[userId];
  //           const unreadCount = channel.countUnread();
  //           const upsertReadsQueries = await upsertReads({
  //             cid,
  //             flush: flushOverride,
  //             reads: [
  //               {
  //                 last_read: ownReads.last_read.toString() as string,
  //                 last_read_message_id: ownReads.last_read_message_id,
  //                 unread_messages: unreadCount,
  //                 user: client.user,
  //               },
  //             ],
  //           });
  //           queries = [...queries, ...upsertReadsQueries];
  //         }
  //       }
  //       return queries;
  //     });
  //   }
  // }

  // if (type === 'message.updated') {
  //   const message = event.message;
  //   if (message && !message.parent_id) {
  //     // Update only if it exists, otherwise event could be related
  //     // to a message which is not in database.
  //     return await queriesWithChannelGuard((flushOverride) =>
  //       updateMessage({
  //         flush: flushOverride,
  //         message,
  //       }),
  //     );
  //   }
  // }

  // if (type === 'reaction.updated') {
  //   const message = event.message;
  //   if (message && event.reaction) {
  //     // We update the entire message to make sure we also update reaction_groups
  //     return await queriesWithChannelGuard((flushOverride) =>
  //       updateMessage({
  //         flush: flushOverride,
  //         message,
  //       }),
  //     );
  //   }
  // }
  //
  // if (type === 'reaction.new' || type === 'reaction.deleted') {
  //   const message = event.message;
  //   if (message && !message.parent_id) {
  //     // Here we are relying on the fact message.latest_reactions always includes
  //     // the new reaction. So we first delete all the existing reactions and populate
  //     // the reactions table with message.latest_reactions
  //     return await queriesWithChannelGuard((flushOverride) =>
  //       updateMessage({
  //         flush: flushOverride,
  //         message,
  //       }),
  //     );
  //   }
  // }

  if (
    type === 'channel.updated' ||
    type === 'channel.visible' ||
    type === 'notification.added_to_channel' ||
    type === 'notification.message_new'
  ) {
    if (event.channel) {
      return upsertChannelData({
        channel: event.channel,
        flush,
      });
    }
  }

  if (
    type === 'channel.hidden' ||
    type === 'channel.deleted' ||
    type === 'notification.removed_from_channel'
  ) {
    if (event.channel) {
      return deleteChannel({
        cid: event.channel.cid,
        flush,
      });
    }
  }

  if (type === 'channel.truncated') {
    if (event.channel) {
      return deleteMessagesForChannel({
        cid: event.channel.cid,
        flush,
      });
    }
  }

  // if (type === 'member.added' || type === 'member.updated') {
  //   const member = event.member;
  //   const cid = event.cid;
  //   if (member && cid) {
  //     return await queriesWithChannelGuard((flushOverride) =>
  //       upsertMembers({
  //         cid,
  //         flush: flushOverride,
  //         members: [member],
  //       }),
  //     );
  //   }
  // }
  //
  // if (type === 'member.removed') {
  //   const member = event.member;
  //   const cid = event.cid;
  //   if (member && cid) {
  //     return await queriesWithChannelGuard((flushOverride) =>
  //       deleteMember({
  //         cid,
  //         flush: flushOverride,
  //         member,
  //       }),
  //     );
  //   }
  // }

  return [];
};
