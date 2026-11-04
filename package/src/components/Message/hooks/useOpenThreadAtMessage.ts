import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useMessagesContext } from '../../../contexts/messagesContext/MessagesContext';
import { useStableCallback } from '../../../hooks';

/**
 * Returns a function that opens the thread holding a message, at that message, through the
 * `onAlsoSentToChannelHeaderPress` handler. The thread is taken from the client when it is
 * registered there; otherwise its parent message is read from the message store, or fetched, and a
 * thread is built from it. Opening the thread loads whatever else it is missing.
 *
 * @returns The function, which takes the thread's `parentId` and the `targetedMessageId` to open
 * the thread at. It does nothing without an `onAlsoSentToChannelHeaderPress` handler.
 */
export const useOpenThreadAtMessage = () => {
  const { onAlsoSentToChannelHeaderPress } = useMessagesContext();
  const { client } = useChatContext();
  const { channel } = useChannelContext();

  return useStableCallback(
    async ({ parentId, targetedMessageId }: { parentId: string; targetedMessageId: string }) => {
      if (!onAlsoSentToChannelHeaderPress) {
        return;
      }

      const registeredThread = client.threads.get(parentId);
      if (registeredThread) {
        onAlsoSentToChannelHeaderPress({ targetedMessageId, thread: registeredThread });
        return;
      }

      try {
        const parentMessage =
          client.messageStore.get(parentId) ??
          (await channel.getMessagesById([parentId])).messages?.[0];

        if (!parentMessage) {
          return;
        }

        onAlsoSentToChannelHeaderPress({
          targetedMessageId,
          thread: client.threads.ensure({ channel, parentMessage }),
        });
      } catch (error) {
        console.error('Error querying parent message:', error);
      }
    },
  );
};
