import { useEffect } from 'react';

import type { Event, StreamChat } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
import { deleteChannel } from '../../../../store/queries/deleteChannel';
import { deleteMessagesForChannel } from '../../../../store/queries/deleteMessagesForChannel';
import { storeChannelInfo } from '../../../../store/queries/storeChannelInfo';
import { storeChannels } from '../../../../store/queries/storeChannelsPerQuery';
import { storeMessage } from '../../../../store/queries/storeMessage';
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

      if (type === 'message.new') {
        if (event.message) {
          storeMessage({
            message: event.message,
          });
        }
      }

      if (type === 'message.updated') {
        if (event.message) {
          storeMessage({
            message: event.message,
          });
        }
      }

      if (type === 'message.deleted') {
        if (event.message) {
          storeMessage({
            message: event.message,
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

      if (type === 'activeChannels.new') {
        if (event.channels) {
          storeChannels({
            channels: event.channels,
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
          storeChannelInfo({
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
