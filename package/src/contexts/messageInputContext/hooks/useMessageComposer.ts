import { useEffect, useMemo, useState } from 'react';

import { CommandResponse, MessageComposer, TextComposerMiddleware } from 'stream-chat';

import { MessageType } from '../../../components/MessageList/hooks/useMessageList';
import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';
import { Emoji } from '../../../emoji-data';
import { TriggerSettings } from '../../../utils/ACITriggerSettings';
import { EmojiSearchIndex } from '../MessageInputContext';
import { createTextComposerCommandMiddleware } from '../middlewares/textComposerCommandMiddleware';
import { createTextComposerEmojiMiddleware } from '../middlewares/textComposerEmojiMiddleware';

class FixedSizeQueueCache<K, T> {
  private keys: Array<K>;
  private size: number;
  private valueByKey: Map<K, T>;
  constructor(size: number) {
    if (!size) throw new Error('Size must be greater than 0');
    this.keys = [];
    this.size = size;
    this.valueByKey = new Map();
  }

  add(key: K, value: T) {
    const index = this.keys.indexOf(key);

    if (index > -1) {
      this.keys.splice(this.keys.indexOf(key), 1);
    } else if (this.keys.length >= this.size) {
      const elementKey = this.keys.shift();

      if (elementKey) {
        this.valueByKey.delete(elementKey);
      }
    }

    this.keys.push(key);
    this.valueByKey.set(key, value);
  }

  peek(key: K) {
    const value = this.valueByKey.get(key);

    return value;
  }

  get(key: K) {
    const foundElement = this.peek(key);

    if (foundElement && this.keys.indexOf(key) !== this.size - 1) {
      this.keys.splice(this.keys.indexOf(key), 1);
      this.keys.push(key);
    }

    return foundElement;
  }
}

export type UseMessageComposerParams = {
  editing?: MessageType;
  emojiSearchIndex?: EmojiSearchIndex;
  autoCompleteTriggerSettings?: TriggerSettings;
};

const queueCache = new FixedSizeQueueCache<string, MessageComposer>(64);

export const useMessageComposer = ({
  editing: editedMessage,
  emojiSearchIndex,
  autoCompleteTriggerSettings,
}: UseMessageComposerParams) => {
  const { channel } = useChannelContext();

  // legacy thread will receive new composer
  const { thread: parentMessage, threadInstance } = useThreadContext();
  // const detachedMessageComposerRef = useRef<MessageComposer>(
  //   new MessageComposer({ channel, tag: 'detached' }),
  // );

  const [cachedEditedMessage, setCachedEditedMessage] = useState<MessageType | undefined>(
    editedMessage ?? undefined,
  );
  const [cachedParentMessage, setCachedParentMessage] = useState<MessageType | undefined>(
    parentMessage ?? undefined,
  );

  if (editedMessage?.id !== cachedEditedMessage?.id) {
    setCachedEditedMessage(editedMessage);
  }

  if (parentMessage?.id !== cachedParentMessage?.id) {
    setCachedParentMessage(parentMessage ?? undefined);
  }

  // composer hierarchy
  // edited message (always new) -> thread instance (own) -> thread message (always new) -> channel (own)
  // editedMessage ?? thread ?? parentMessage ?? channel;

  const messageComposer = useMemo(() => {
    if (cachedEditedMessage) {
      const tag = `edited-message-${cachedEditedMessage.id}`;

      const element = queueCache.get(tag);
      if (element) return element;

      const c = new MessageComposer({
        channel,
        composition: cachedEditedMessage,
        tag,
      });

      return c;
    } else if (threadInstance) {
      return threadInstance.messageComposer;
    } else if (cachedParentMessage) {
      const tag = `parent-message-${cachedParentMessage.id}`;

      const element = queueCache.get(tag);
      if (element) return element;

      const c = new MessageComposer({
        channel,
        tag,
        threadId: cachedParentMessage.id,
      });

      return c;
    } else {
      const tag = `channel-${channel.id}`;
      const element = queueCache.get(tag);
      if (element) return element;

      const c = new MessageComposer({
        channel,
        tag,
      });
      c.textComposer.use([
        createTextComposerCommandMiddleware<CommandResponse>(
          channel,
          autoCompleteTriggerSettings?.['/'],
        ) as TextComposerMiddleware,
        createTextComposerEmojiMiddleware<Emoji>(
          emojiSearchIndex,
          autoCompleteTriggerSettings?.[':'],
        ) as TextComposerMiddleware,
      ]);

      return c;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cachedEditedMessage, cachedParentMessage, channel, emojiSearchIndex, threadInstance]);

  useEffect(() => {
    messageComposer.registerSubscriptions();
    return () => {
      messageComposer.unregisterSubscriptions();
    };
  }, [messageComposer]);

  return messageComposer;
};
