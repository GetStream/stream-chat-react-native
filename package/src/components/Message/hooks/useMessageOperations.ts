import {
  Channel as ChannelClass,
  DeleteMessageOptions,
  LocalMessage,
  MessageResponse,
  Reaction,
} from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';
import { useStableCallback } from '../../../hooks';
import { addReactionToLocalState } from '../../../utils/addReactionToLocalState';
import { removeReactionFromLocalState } from '../../../utils/removeReactionFromLocalState';
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
 * Message operations (delete/remove/retry/react/update) resolved from the channel and — when a
 * thread is open — the thread instance. These are thin wrappers over the stream-chat message
 * operations engine (`*WithLocalUpdate`, `messagePaginator.ingestItem/removeItem`), which owns the
 * optimistic lifecycle, offline-DB persistence and paginator ingest. Previously these lived on the
 * MessagesContext; they now resolve per-message (mirroring stream-chat-react, which has no shared
 * action context) so the operations stay co-located with the LLC state they drive.
 */
export const useMessageOperations = (): MessageOperations => {
  const { client, enableOfflineSupport } = useChatContext();
  const { channel, enforceUniqueReaction } = useChannelContext();
  const { threadInstance } = useThreadContext();

  const updateMessage: MessageOperations['updateMessage'] = useStableCallback((updatedMessage) => {
    if (!channel) {
      return;
    }

    const formatted = channel.state.formatMessage(updatedMessage);
    if (!updatedMessage.parent_id || updatedMessage.show_in_channel) {
      channel.messagePaginator.ingestItem(formatted);
    }
    if (updatedMessage.parent_id) {
      threadInstance?.messagePaginator?.ingestItem(formatted);
    }
  });

  /**
   * Removes the message from local state
   */
  const removeMessage: MessageOperations['removeMessage'] = useStableCallback(async (message) => {
    if (channel) {
      // removeItem is a no-op when the item isn't in that paginator, so removing from the channel
      // unconditionally is safe (a hidden reply simply isn't there) and covers replies shown in
      // the channel; replies additionally live in the open thread's paginator. No channel.state
      // write (that store is being removed).
      channel.messagePaginator.removeItem({ id: message.id });
      if (message.parent_id) {
        threadInstance?.messagePaginator?.removeItem({ id: message.id });
      }
    }

    if (client.offlineDb) {
      await client.offlineDb.handleRemoveMessage({ messageId: message.id });
    }
  });

  const retrySendMessage: MessageOperations['retrySendMessage'] = useStableCallback(
    async (localMessage) => {
      await (threadInstance ?? channel).retrySendMessageWithLocalUpdate({ localMessage });
    },
  );

  const sendReaction: MessageOperations['sendReaction'] = useStableCallback(
    async (type, messageId) => {
      if (!channel?.id || !client.user) {
        throw new Error('Channel has not been initialized');
      }

      const payload: Parameters<ChannelClass['sendReaction']> = [
        messageId,
        {
          type,
        } as Reaction,
        { enforce_unique: enforceUniqueReaction },
      ];

      if (enableOfflineSupport) {
        const messageWithReaction = await addReactionToLocalState({
          channel,
          enforceUniqueReaction,
          messageId,
          reactionType: type,
          user: client.user,
        });

        if (messageWithReaction) {
          if (!messageWithReaction.parent_id || messageWithReaction.show_in_channel) {
            channel.messagePaginator.ingestItem(messageWithReaction);
          }
          if (messageWithReaction.parent_id) {
            threadInstance?.messagePaginator?.ingestItem(messageWithReaction);
          }
        }
      }

      const sendReactionResponse = await channel.sendReaction(...payload);

      if (sendReactionResponse?.message) {
        threadInstance?.upsertReplyLocally?.({ message: sendReactionResponse.message });
      }
    },
  );

  const deleteReaction: MessageOperations['deleteReaction'] = useStableCallback(
    async (type, messageId) => {
      if (!channel?.id || !client.user) {
        throw new Error('Channel has not been initialized');
      }

      const payload: Parameters<ChannelClass['deleteReaction']> = [messageId, type];

      if (enableOfflineSupport) {
        const messageWithoutReaction = removeReactionFromLocalState({
          channel,
          messageId,
          reactionType: type,
          user: client.user,
        });

        if (messageWithoutReaction) {
          if (!messageWithoutReaction.parent_id || messageWithoutReaction.show_in_channel) {
            channel.messagePaginator.ingestItem(messageWithoutReaction);
          }
          if (messageWithoutReaction.parent_id) {
            threadInstance?.messagePaginator?.ingestItem(messageWithoutReaction);
          }
        }
      }

      await channel.deleteReaction(...payload);
    },
  );

  const deleteMessage: MessageOperations['deleteMessage'] = useStableCallback(
    async (message, optionsOrHardDelete = false) => {
      if (!channel?.id) {
        throw new Error('Channel has not been initialized yet');
      }

      // A failed (never-sent) message exists only locally — remove it without a server delete.
      if (message.status === MessageStatusTypes.FAILED) {
        await removeMessage(message);
        return;
      }

      let options: DeleteMessageOptions = {};
      if (typeof optionsOrHardDelete === 'boolean') {
        options = optionsOrHardDelete ? { hardDelete: true } : {};
      } else if (optionsOrHardDelete?.deleteForMe) {
        options = { deleteForMe: true };
      } else if (optionsOrHardDelete?.hardDelete) {
        options = { hardDelete: true };
      }

      // The LLC performs the delete request (honoring any configState delete handler) and ingests
      // the deleted message into the paginator. Thread deletes route through the thread instance.
      await (threadInstance ?? channel).deleteMessageWithLocalUpdate({
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
