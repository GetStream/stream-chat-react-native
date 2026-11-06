import { LocalMessage } from 'stream-chat';

export type MessageListItemWithNeighbours = {
  nextMessage?: LocalMessage;
  previousMessage?: LocalMessage;
  message: LocalMessage;
};

/**
 * The stable identity of a message row, used as both the list render key and the neighbour-cache
 * key. The two must agree: otherwise the cache stores a row under one key while the list renders it
 * under another, and memoization never hits.
 *
 * @param item The message of the row.
 * @param index The position of the row, used when the message has neither an ID nor a timestamp.
 * @returns The row key.
 */
export const getMessageListItemCacheKey = (item: LocalMessage, index: number) => {
  if (item.id) {
    return item.id;
  }
  // Nullish check: `created_at` is in unix nanoseconds and `0` is valid. The index fallback shifts
  // as pages load.
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
