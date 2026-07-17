import { useEffect, useMemo } from 'react';

import { MessageComposer } from 'stream-chat';

import { useChatContext } from '../../chatContext/ChatContext';
import { MessageComposerContextValue } from '../../messageComposerContext/MessageComposerContext';

export const useCreateMessageComposer = ({
  editing: editedMessage,
  threadInstance,
  channel,
}: Pick<MessageComposerContextValue, 'channel' | 'threadInstance' | 'editing'>) => {
  const { client } = useChatContext();
  const { messageComposerCache: queueCache } = client;

  const cachedEditedMessage = useMemo(() => {
    if (!editedMessage) return undefined;

    return editedMessage;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedMessage?.id]);

  // composer hierarchy: edited message (always new) -> thread instance (own) -> channel (own)
  // editedMessage ?? threadInstance ?? channel
  const messageComposer = useMemo(() => {
    if (cachedEditedMessage) {
      const tag = MessageComposer.constructTag(cachedEditedMessage);

      const cachedComposer = queueCache.get(tag);
      if (cachedComposer) {
        cachedComposer.editedMessage = cachedEditedMessage;
        return cachedComposer;
      }

      return new MessageComposer({
        client,
        composition: cachedEditedMessage,
        compositionContext: cachedEditedMessage,
      });
    } else if (threadInstance) {
      return threadInstance.messageComposer;
    } else {
      return channel.messageComposer;
    }
  }, [cachedEditedMessage, channel.messageComposer, client, queueCache, threadInstance]);

  if (
    (['message'] as MessageComposer['contextType'][]).includes(messageComposer.contextType) &&
    !queueCache.peek(messageComposer.tag)
  ) {
    queueCache.add(messageComposer.tag, messageComposer);
  }

  useEffect(() => {
    const unsubscribe = messageComposer.registerSubscriptions();
    return () => {
      unsubscribe();
    };
  }, [messageComposer]);

  return messageComposer;
};
