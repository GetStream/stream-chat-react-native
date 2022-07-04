import { useEffect } from 'react';

import type { Event, StreamChat } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
import { deleteChannel } from '../../../../store/apis/deleteChannel';
import { deleteMessagesForChannel } from '../../../../store/apis/deleteMessagesForChannel';
import { upsertChannelInfo } from '../../../../store/apis/upsertChannelInfo';
import { updateMessage } from '../../../../store/apis/updateMessage';
import { upsertChannels } from '../../../../store/apis/upsertChannels';
import { upsertMessages } from '../../../../store/apis/upsertMessages';
import { upsertReads } from '../../../../store/apis/upsertReads';
import type { DefaultStreamChatGenerics } from '../../../../types/types';

type Params = {
  enableOfflineSupport: boolean;
};
export const useSyncDatabase = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  enableOfflineSupport,
}: Params) => {
  const { client } = useChatContext<StreamChatGenerics>();
  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
      const { type } = event;

      if (type === 'message.read') {
        if (event.user?.id && event.cid) {
          console.log(event.user);
          upsertReads<StreamChatGenerics>({
            cid: event.cid,
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
          upsertMessages<StreamChatGenerics>({
            messages: [event.message],
          });
        }
      }

      if (type === 'message.updated' || type === 'message.deleted') {
        if (event.message && !event.message.parent_id) {
          // Update only if it exists, otherwise event could be related
          // to a message which is not related to existing messages with database.
          updateMessage<StreamChatGenerics>({
            message: event.message,
          });
        }
      }
      if (type === 'reaction.updated') {
        console.log(type);
        if (event.message && event.reaction) {
          updateMessage<StreamChatGenerics>({
            message: event.message,
          });
        }
      }

      if (type === 'reaction.new' || type === 'reaction.deleted') {
        console.log(type);
        if (event.message && !event.message.parent_id) {
          updateMessage<StreamChatGenerics>({
            message: event.message,
          });
        }
      }

      if (type === 'channel.updated') {
        if (event.channel) {
          upsertChannelInfo({
            channel: event.channel,
          });
        }
      }

      if (type === 'channel.hidden') {
        if (event.channel) {
          deleteChannel({
            cid: event.channel.cid,
          });
        }
      }

      if (type === 'channel.visible') {
        if (event.channel) {
          upsertChannelInfo({
            channel: event.channel,
          });
        }
      }

      if (type === 'channel.truncated') {
        if (event.channel) {
          deleteMessagesForChannel({
            cid: event.channel.cid,
          });
        }
      }

      if (type === 'channel.deleted') {
        if (event.channel) {
          deleteChannel({
            cid: event.channel.cid,
          });
        }
      }

      if (type === 'channels.queried') {
        if (event.channels) {
          upsertChannels<StreamChatGenerics>({
            channels: event.channels,
            isLatestMessagesSet: event.isLatestMessageSet,
          });
        }
      }

      if (type === 'notification.added_to_channel') {
        if (event.channel) {
          upsertChannelInfo({
            channel: event.channel,
          });
        }
      }

      if (type === 'notification.removed_from_channel') {
        if (event.channel) {
          deleteChannel({
            cid: event.channel.cid,
          });
        }
      }

      if (type === 'notification.message_new') {
        if (event.channel) {
          upsertChannelInfo<StreamChatGenerics>({
            channel: event.channel,
          });
        }
      }
    };

    let listener: ReturnType<StreamChat['on']>;

    if (enableOfflineSupport) {
      listener = client?.on(handleEvent);
    }

    return () => {
      listener?.unsubscribe();
    };
  }, [client]);
};
