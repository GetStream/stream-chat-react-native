import type { Event } from 'stream-chat';

import { deleteChannel } from '../../../../store/apis/deleteChannel';
import { deleteMember } from '../../../../store/apis/deleteMember';
import { deleteMessagesForChannel } from '../../../../store/apis/deleteMessagesForChannel';
import { updateMessage } from '../../../../store/apis/updateMessage';
import { upsertChannelInfo } from '../../../../store/apis/upsertChannelInfo';
import { upsertChannels } from '../../../../store/apis/upsertChannels';
import { upsertMembers } from '../../../../store/apis/upsertMembers';
import { upsertMessages } from '../../../../store/apis/upsertMessages';
import { upsertReads } from '../../../../store/apis/upsertReads';
import type { DefaultStreamChatGenerics } from '../../../../types/types';

export const handleEventToSyncDB = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  event: Event<StreamChatGenerics>,
  flush?: boolean,
) => {
  const { type } = event;

  if (type === 'message.read') {
    if (event.user?.id && event.cid) {
      return upsertReads<StreamChatGenerics>({
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
    if (event.message && !event.message.parent_id) {
      return upsertMessages<StreamChatGenerics>({
        flush,
        messages: [event.message],
      });
    }
  }

  if (type === 'message.updated' || type === 'message.deleted') {
    if (event.message && !event.message.parent_id) {
      // Update only if it exists, otherwise event could be related
      // to a message which is not related to existing messages with database.
      return updateMessage<StreamChatGenerics>({
        flush,
        message: event.message,
      });
    }
  }
  if (type === 'reaction.updated') {
    if (event.message && event.reaction) {
      updateMessage<StreamChatGenerics>({
        flush,
        message: event.message,
      });
    }
  }

  if (type === 'reaction.new' || type === 'reaction.deleted') {
    if (event.message && !event.message.parent_id) {
      return updateMessage<StreamChatGenerics>({
        flush,
        message: event.message,
      });
    }
  }

  if (type === 'channel.updated') {
    if (event.channel) {
      return upsertChannelInfo({
        channel: event.channel,
        flush,
      });
    }
  }

  if (type === 'channel.hidden') {
    if (event.channel) {
      return deleteChannel({
        cid: event.channel.cid,
        flush,
      });
    }
  }

  if (type === 'channel.visible') {
    if (event.channel) {
      return upsertChannelInfo({
        channel: event.channel,
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

  if (type === 'channel.deleted') {
    if (event.channel) {
      return deleteChannel({
        cid: event.channel.cid,
        flush,
      });
    }
  }

  if (type === 'channels.queried') {
    if (event.queriedChannels) {
      return upsertChannels<StreamChatGenerics>({
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

  if (type === 'notification.added_to_channel') {
    if (event.channel) {
      return upsertChannelInfo({
        channel: event.channel,
        flush,
      });
    }
  }

  if (type === 'notification.removed_from_channel') {
    if (event.channel) {
      return deleteChannel({
        cid: event.channel.cid,
        flush,
      });
    }
  }

  if (type === 'notification.message_new') {
    if (event.channel) {
      return upsertChannelInfo<StreamChatGenerics>({
        channel: event.channel,
        flush,
      });
    }
  }

  return [];
};
