import { useEffect, useMemo } from 'react';

import { FixedSizeQueueCache, MessageComposer } from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';

const queueCache = new FixedSizeQueueCache<string, MessageComposer>(64);

export const useMessageComposer = () => {
  const { client } = useChatContext();
  const { channel, editing: editedMessage } = useChannelContext();

  // legacy thread will receive new composer
  const { thread: parentMessage, threadInstance } = useThreadContext();

  const cachedEditedMessage = useMemo(() => {
    if (!editedMessage) return undefined;

    return editedMessage;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedMessage?.id]);

  const cachedParentMessage = useMemo(() => {
    if (!parentMessage) return undefined;

    return parentMessage;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentMessage?.id]);

  // composer hierarchy
  // edited message (always new) -> thread instance (own) -> thread message (always new) -> channel (own)
  // editedMessage ?? thread ?? parentMessage ?? channel;

  const messageComposer = useMemo(() => {
    if (editedMessage && cachedEditedMessage) {
      const tag = MessageComposer.constructTag(cachedEditedMessage);

      const cachedComposer = queueCache.get(tag);
      if (cachedComposer) return cachedComposer;

      return new MessageComposer({
        client,
        composition: cachedEditedMessage,
        compositionContext: cachedEditedMessage,
      });
    } else if (threadInstance) {
      return threadInstance.messageComposer;
    } else if (cachedParentMessage) {
      const compositionContext = {
        ...cachedParentMessage,
        legacyThreadId: cachedParentMessage.id,
      };

      const tag = MessageComposer.constructTag(compositionContext);

      const cachedComposer = queueCache.get(tag);
      if (cachedComposer) return cachedComposer;

      return new MessageComposer({
        client,
        compositionContext,
      });
    } else {
      return channel.messageComposer;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cachedEditedMessage, cachedParentMessage, channel, threadInstance]);

  if (
    (['legacy_thread', 'message'] as MessageComposer['contextType'][]).includes(
      messageComposer.contextType,
    ) &&
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
