import { LocalMessage } from 'stream-chat';

export type MessageListItemWithNeighbours = {
  nextMessage?: LocalMessage;
  previousMessage?: LocalMessage;
  message: LocalMessage;
};

/**
 * The stable identity of a message row, used both as the FlatList/FlashList render key and as the
 * neighbour-cache key. Those two must agree: if they diverge for the same message the cache stores
 * a row under one key while the list renders it under another, and memoisation silently never hits.
 */
export const getMessageListItemCacheKey = (item: LocalMessage, index: number) => {
  if (item.id) {
    return item.id;
  }
  // Nullish, not truthy: `created_at` is unix nanoseconds and `0` is a legitimate value (the
  // epoch). Treating it as absent falls through to the index, which shifts as pages load.
  if (item.created_at != null) {
    return String(item.created_at);
  }
  return `index-${index}`;
};

export const buildMessageListWithNeighbours = (
  processedMessageList: LocalMessage[],
  previousDerivedItems: Map<string, MessageListItemWithNeighbours>,
) => {
  const nextDerivedItems = new Map<string, MessageListItemWithNeighbours>();

  const items = processedMessageList.map((message, index) => {
    const cacheKey = getMessageListItemCacheKey(message, index);
    const previousMessage = processedMessageList[index + 1];
    const nextMessage = processedMessageList[index - 1];
    const previousDerived = previousDerivedItems.get(cacheKey);

    if (
      previousDerived &&
      previousDerived.message === message &&
      previousDerived.previousMessage === previousMessage &&
      previousDerived.nextMessage === nextMessage
    ) {
      nextDerivedItems.set(cacheKey, previousDerived);
      return previousDerived;
    }

    const derivedItem: MessageListItemWithNeighbours = {
      nextMessage,
      previousMessage,
      message,
    };

    nextDerivedItems.set(cacheKey, derivedItem);
    return derivedItem;
  });

  return { items, nextDerivedItems };
};
