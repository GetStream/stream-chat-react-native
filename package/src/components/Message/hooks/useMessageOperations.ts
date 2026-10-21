import { DeleteMessageOptions, LocalMessage, MessageResponse } from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';
import { useStableCallback } from '../../../hooks';
import { MessageStatusTypes } from '../../../utils/utils';

export type MessageOperations = {
  // FIXME: Remove the signature with optionsOrHardDelete boolean with the next major release
  deleteMessage: (
    message: LocalMessage,
    optionsOrHardDelete?: boolean | DeleteMessageOptions,
  ) => Promise<void>;
  deleteReaction: (type: string, messageId: string) => Promise<void>;
  removeMessage: (message: { id: string; parent_id?: string }) => Promise<void>;
  retrySendMessage: (message: LocalMessage) => Promise<void>;
  sendReaction: (type: string, messageId: string) => Promise<void>;
  updateMessage: (updatedMessage: MessageResponse | LocalMessage) => void;
};

/**
 * Message operations (delete, remove, retry, react, update) routed to the channel and, when a
 * thread is open, to the thread. They are thin wrappers over the `stream-chat` `messageOperations`
 * and message paginators, which own the optimistic lifecycle, offline DB persistence and paginator
 * ingest.
 *
 * @returns The message operations.
 */
export const useMessageOperations = (): MessageOperations => {
  const { client } = useChatContext();
  const { channel, enforceUniqueReaction } = useChannelContext();
  const { thread } = useThreadContext();

  const updateMessage: MessageOperations['updateMessage'] = useStableCallback((updatedMessage) => {
    if (!channel) {
      return;
    }

    const formatted = channel.state.formatMessage(updatedMessage);
    if (!updatedMessage.parent_id || updatedMessage.show_in_channel) {
      channel.messagePaginator.ingestItem(formatted);
    }
    if (updatedMessage.parent_id) {
      thread?.messagePaginator?.ingestItem(formatted);
    }
  });

  const removeMessage: MessageOperations['removeMessage'] = useStableCallback(async (message) => {
    if (channel) {
      // `removeItem` is a no-op for an item the paginator does not hold, so removing from the
      // channel unconditionally is safe and covers replies shown in the channel. Replies also
      // live in the open thread's paginator.
      channel.messagePaginator.removeItem({ id: message.id });
      if (message.parent_id) {
        thread?.messagePaginator?.removeItem({ id: message.id });
      }
    }

    if (client.offlineDb) {
      await client.offlineDb.handleRemoveMessage({ messageId: message.id });
    }
  });

  const retrySendMessage: MessageOperations['retrySendMessage'] = useStableCallback(
    async (localMessage) => {
      await (thread ?? channel).messageOperations.retry({ localMessage });
    },
  );

  const sendReaction: MessageOperations['sendReaction'] = useStableCallback(
    async (type, messageId) => {
      if (!channel?.id || !client.user) {
        throw new Error('Channel has not been initialized');
      }

      // The optimistic update goes to the paginator that holds the message: the open thread for a
      // reply loaded there (the channel paginator cannot hold pure replies), otherwise the channel.
      // Both forward the request through `channel.sendReaction`, so this only picks the ingest
      // target and keeps a channel message's reaction out of the thread paginator.
      const target = thread?.messagePaginator.getItem(messageId) ? thread : channel;

      await target.messageOperations.addReaction({
        messageId,
        options: { enforce_unique: enforceUniqueReaction },
        reaction: { type },
      });
    },
  );

  const deleteReaction: MessageOperations['deleteReaction'] = useStableCallback(
    async (type, messageId) => {
      if (!channel?.id || !client.user) {
        throw new Error('Channel has not been initialized');
      }

      const target = thread?.messagePaginator.getItem(messageId) ? thread : channel;

      await target.messageOperations.deleteReaction({ messageId, type });
    },
  );

  const deleteMessage: MessageOperations['deleteMessage'] = useStableCallback(
    async (message, optionsOrHardDelete = false) => {
      if (!channel?.id) {
        throw new Error('Channel has not been initialized yet');
      }

      // A failed send exists only locally, so it is removed without a server delete. A failed edit
      // has the same status but the server has the message, and carries `message_text_updated_at`.
      if (message.status === MessageStatusTypes.FAILED && !message.message_text_updated_at) {
        await removeMessage(message);
        return;
      }

      let options: DeleteMessageOptions = {};
      if (typeof optionsOrHardDelete === 'boolean') {
        options = optionsOrHardDelete ? { hard: true } : {};
      } else if (optionsOrHardDelete?.delete_for_me) {
        options = { delete_for_me: true };
      } else if (optionsOrHardDelete?.hard) {
        options = { hard: true };
      }

      // The LLC owns the delete lifecycle: the optimistic `deleted` marking (or removal for a hard
      // delete), the request, the offline DB write, and the revert if the delete is rejected.
      // Routed like `sendReaction`: a reply loaded in the open thread goes through the thread, all
      // else (including the thread's parent message, which its paginator cannot hold) through the
      // channel.
      const target = thread?.messagePaginator.getItem(message.id) ? thread : channel;
      await target.messageOperations.delete({
        localMessage: message,
        options,
      });
    },
  );

  return {
    deleteMessage,
    deleteReaction,
    removeMessage,
    retrySendMessage,
    sendReaction,
    updateMessage,
  };
};
