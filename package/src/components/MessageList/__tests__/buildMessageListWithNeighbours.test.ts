import { LocalMessage } from 'stream-chat';

import { convertDateToTimestamp } from '../../../mock-builders/generator/time';

import {
  buildMessageListWithNeighbours,
  getMessageListItemCacheKey,
  MessageListItemWithNeighbours,
} from '../utils/buildMessageListWithNeighbours';

const createMessage = (id: string) =>
  ({
    id,
    text: id,
  }) as LocalMessage;

describe('buildMessageListWithNeighbours', () => {
  it('keeps reference for unaffected rows and updates only affected rows', () => {
    const m3 = createMessage('m3');
    const m2 = createMessage('m2');
    const m1 = createMessage('m1');

    const firstPass = buildMessageListWithNeighbours([m3, m2, m1], new Map());
    const oldItems = firstPass.items;

    const m4 = createMessage('m4');
    const secondPass = buildMessageListWithNeighbours([m4, m3, m2, m1], firstPass.nextDerivedItems);

    const newItems = secondPass.items;

    expect(newItems[0]).not.toBe(oldItems[0]);
    expect(newItems[1]).not.toBe(oldItems[0]);
    expect(newItems[2]).toBe(oldItems[1]);
    expect(newItems[3]).toBe(oldItems[2]);
  });

  it('sets previous/next neighbors correctly', () => {
    const m3 = createMessage('m3');
    const m2 = createMessage('m2');
    const m1 = createMessage('m1');

    const { items } = buildMessageListWithNeighbours([m3, m2, m1], new Map());
    const [row0, row1, row2] = items as MessageListItemWithNeighbours[];

    expect(row0.previousMessage?.id).toBe('m2');
    expect(row0.nextMessage).toBeUndefined();

    expect(row1.previousMessage?.id).toBe('m1');
    expect(row1.nextMessage?.id).toBe('m3');

    expect(row2.previousMessage).toBeUndefined();
    expect(row2.nextMessage?.id).toBe('m2');
  });
});

// The key is both the FlatList/FlashList render key and the neighbour-cache key, so it has to be
// stable across renders and identical between the two uses. `created_at` is unix nanoseconds, which
// makes the epoch `0` — a legitimate value that a truthiness guard mistakes for "absent".
describe('getMessageListItemCacheKey', () => {
  it('prefers the message id', () => {
    expect(getMessageListItemCacheKey(createMessage('m1'), 3)).toBe('m1');
  });

  it('falls back to created_at for an id-less message', () => {
    const message = {
      created_at: convertDateToTimestamp('2026-01-01T15:53:00.000Z'),
    } as LocalMessage;

    expect(getMessageListItemCacheKey(message, 3)).toBe(String(message.created_at));
  });

  it('treats the epoch as a real timestamp rather than a missing one', () => {
    // A truthiness guard skips `created_at` here and returns the index instead, which shifts as
    // older pages load — and used to return `Date.now()`, a different key on every render.
    const message = { created_at: 0 } as LocalMessage;

    expect(getMessageListItemCacheKey(message, 3)).toBe('0');
    expect(getMessageListItemCacheKey(message, 7)).toBe('0');
  });

  it('falls back to the index only when there is nothing else', () => {
    expect(getMessageListItemCacheKey({} as LocalMessage, 3)).toBe('index-3');
  });
});
