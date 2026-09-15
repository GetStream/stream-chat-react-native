import { LocalMessage } from 'stream-chat';

import { MessagesContextValue } from '../../../contexts/messagesContext/MessagesContext';
import { getDateSeparatorValue } from '../hooks/useMessageDateSeparator';

export type MessageListItemWithNeighbours = {
  nextMessage?: LocalMessage;
  previousMessage?: LocalMessage;
  message: LocalMessage;
  /** The date separator to render above this row, if any. */
  dateSeparatorDate?: Date;
  /** The date separator rendered above the next row, needed to close a message group. */
  nextMessageDateSeparatorDate?: Date;
};

/**
 * The SDK's date separator rule, in the shape the `getDateSeparators` override uses: a map of
 * message id to the separator rendered above that message.
 *
 * Exported so integrators can build on the default rule instead of reimplementing it.
 *
 * @param messages the loaded messages, oldest first
 */
export const getDefaultDateSeparators = ({
  hideDateSeparators,
  messages,
}: {
  messages: LocalMessage[];
  hideDateSeparators?: boolean;
}) => {
  const separators: Record<string, Date> = {};

  if (hideDateSeparators) {
    return separators;
  }

  for (let index = 0; index < messages.length; index++) {
    const message = messages[index];
    const date = getDateSeparatorValue({ message, previousMessage: messages[index - 1] });
    if (date) {
      separators[message.id] = date;
    }
  }

  return separators;
};

/**
 * Resolves the date separator for every row, using the `getDateSeparators` override when one is
 * supplied and the SDK's own rule otherwise.
 *
 * The override always receives the list oldest first, whichever list component is rendering, so
 * the same override works under `MessageList` and `MessageFlashList`.
 */
export const resolveDateSeparatorDates = (
  messages: LocalMessage[],
  {
    getDateSeparators,
    hideDateSeparators,
    isInverted,
  }: {
    isInverted: boolean;
    getDateSeparators: NonNullable<MessagesContextValue['getDateSeparators']>;
    hideDateSeparators?: boolean;
  },
) => {
  const separators = getDateSeparators({
    hideDateSeparators,
    messages: isInverted ? [...messages].reverse() : messages,
  });

  const dateSeparatorDates: (Date | undefined)[] = new Array(messages.length).fill(undefined);

  for (let index = 0; index < messages.length; index++) {
    const message = messages[index];
    const date = separators[message.id];
    // Keep the message's own Date instance whenever the value matches, so that rows whose
    // separator has not actually changed stay memoized across list updates.
    dateSeparatorDates[index] = date && +date === +message.created_at ? message.created_at : date;
  }

  return dateSeparatorDates;
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
  dateSeparatorDates?: (Date | undefined)[],
) => {
  const nextDerivedItems = new Map<string, MessageListItemWithNeighbours>();

  const items = processedMessageList.map((message, index) => {
    const cacheKey = getMessageListItemCacheKey(message, index);
    const previousMessage = processedMessageList[index + 1];
    const nextMessage = processedMessageList[index - 1];
    const previousDerived = previousDerivedItems.get(cacheKey);

    // Without a `getDateSeparators` override there are no resolved dates to carry, and rows
    // derive their own - so the default path does not pay for the two extra fields at all.
    if (!dateSeparatorDates) {
      if (
        previousDerived &&
        previousDerived.message === message &&
        previousDerived.previousMessage === previousMessage &&
        previousDerived.nextMessage === nextMessage &&
        previousDerived.dateSeparatorDate === undefined
      ) {
        nextDerivedItems.set(cacheKey, previousDerived);
        return previousDerived;
      }

      const derivedItem: MessageListItemWithNeighbours = { nextMessage, previousMessage, message };

      nextDerivedItems.set(cacheKey, derivedItem);
      return derivedItem;
    }

    const dateSeparatorDate = dateSeparatorDates[index];
    // the list is inverted, so the next (newer) row sits at index - 1
    const nextMessageDateSeparatorDate = dateSeparatorDates[index - 1];

    if (
      previousDerived &&
      previousDerived.message === message &&
      previousDerived.previousMessage === previousMessage &&
      previousDerived.nextMessage === nextMessage &&
      previousDerived.dateSeparatorDate === dateSeparatorDate &&
      previousDerived.nextMessageDateSeparatorDate === nextMessageDateSeparatorDate
    ) {
      nextDerivedItems.set(cacheKey, previousDerived);
      return previousDerived;
    }

    const derivedItem: MessageListItemWithNeighbours = {
      dateSeparatorDate,
      nextMessage,
      nextMessageDateSeparatorDate,
      previousMessage,
      message,
    };

    nextDerivedItems.set(cacheKey, derivedItem);
    return derivedItem;
  });

  return { items, nextDerivedItems };
};
