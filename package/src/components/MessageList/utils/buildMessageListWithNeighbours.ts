import { LocalMessage } from 'stream-chat';

export type MessageListItemWithNeighbours = {
  nextMessage?: LocalMessage;
  previousMessage?: LocalMessage;
  message: LocalMessage;
};

export const getMessageListItemCacheKey = (item: LocalMessage, index: number) => {
  if (item.id) {
    return item.id;
  }
  if (item.created_at) {
    return typeof item.created_at === 'string' ? item.created_at : item.created_at.toISOString();
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
