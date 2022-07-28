import type { Event } from 'stream-chat';

import { deleteChannel } from '../../../store/apis/deleteChannel';
import { deleteMember } from '../../../store/apis/deleteMember';
import { deleteMessagesForChannel } from '../../../store/apis/deleteMessagesForChannel';
import { updateMessage } from '../../../store/apis/updateMessage';
import { upsertChannelData } from '../../../store/apis/upsertChannelData';
import { upsertChannels } from '../../../store/apis/upsertChannels';
import { upsertMembers } from '../../../store/apis/upsertMembers';
import { upsertMessages } from '../../../store/apis/upsertMessages';
import { upsertReads } from '../../../store/apis/upsertReads';

export const handleEventToSyncDB = (event: Event, flush?: boolean) => {
  const { type } = event;

  if (type === 'message.read') {
    if (event.user?.id && event.cid) {
      return upsertReads({
        cid: event.cid,
        flush,
        reads: [
          {
            last_read: event.received_at as string,
            unread_messages: 0,
            user: event.user,
          },
        ],
      });
    }
  }

  if (type === 'message.new') {
    if (event.message && (!event.message.parent_id || event.message.show_in_channel)) {
      return upsertMessages({
        flush,
        messages: [event.message],
      });
    }
  }

  if (type === 'message.updated' || type === 'message.deleted') {
    if (event.message && !event.message.parent_id) {
      // Update only if it exists, otherwise event could be related
      // to a message which is not in database.
      return updateMessage({
        flush,
        message: event.message,
      });
    }
  }

  if (type === 'reaction.updated') {
    if (event.message && event.reaction) {
      // We update the entire message to make sure we also update
      // reaction_counts.
      return updateMessage({
        flush,
        message: event.message,
      });
    }
  }

  if (type === 'reaction.new' || type === 'reaction.deleted') {
    if (event.message && !event.message.parent_id) {
      // Here we are relying on the fact message.latest_reactions always includes
      // the new reaction. So we first delete all the existing reactions and populate
      // the reactions table with message.latest_reactions
      return updateMessage({
        flush,
        message: event.message,
      });
    }
  }

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

  if (type === 'channels.queried') {
    if (event.queriedChannels?.channels?.length) {
      return upsertChannels({
        channels: event.queriedChannels?.channels,
        flush,
        isLatestMessagesSet: event.queriedChannels?.isLatestMessageSet,
      });
    }
  }

  if (type === 'member.added' || type === 'member.updated') {
    if (event.member && event.cid) {
      return upsertMembers({
        cid: event.cid,
        flush,
        members: [event.member],
      });
    }
  }

  if (type === 'member.removed') {
    if (event.member && event.cid) {
      return deleteMember({
        cid: event.cid,
        flush,
        member: event.member,
      });
    }
  }

  return [];
};
