import { LocalMessage } from 'stream-chat';

import {
  buildMessageListWithNeighbours,
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
