import { useEffect } from 'react';

import type { Event, StreamChat } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
import { deleteChannel } from '../../../../store/apis/deleteChannel';
import { deleteMessagesForChannel } from '../../../../store/apis/deleteMessagesForChannel';
import { storeChannelInfo } from '../../../../store/apis/storeChannelInfo';
import { storeChannels } from '../../../../store/apis/storeChannels';
import { storeReads } from '../../../../store/apis/storeReads';
import { updateMessages } from '../../../../store/apis/updateMessages';
import { storeMessages } from '../../../../store/apis/upsertMessages';
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
          storeReads<StreamChatGenerics>({
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
        if (event.message) {
          storeMessages<StreamChatGenerics>({
            messages: [event.message],
          });
        }
      }

      if (type === 'message.updated') {
        if (event.message) {
          updateMessages<StreamChatGenerics>({
            messages: [event.message],
          });
        }
      }

      if (type === 'message.deleted') {
        if (event.message) {
          storeMessages<StreamChatGenerics>({
            messages: [event.message],
          });
        }
      }

      if (type === 'reaction.new' || type === 'reaction.updated' || type === 'reaction.deleted') {
        if (event.message) {
          updateMessages<StreamChatGenerics>({
            messages: [event.message],
          });
        }
      }

      if (type === 'channel.updated') {
        if (event.channel) {
          storeChannelInfo({
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
          storeChannelInfo({
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
          storeChannels<StreamChatGenerics>({
            channels: event.channels,
            isLatestMessagesSet: event.isLatestMessageSet,
          });
        }
      }

      if (type === 'notification.added_to_channel') {
        if (event.channel) {
          storeChannelInfo({
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
          storeChannelInfo<StreamChatGenerics>({
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
