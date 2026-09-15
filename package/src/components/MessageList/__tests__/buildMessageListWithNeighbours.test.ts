import { LocalMessage } from 'stream-chat';

import {
  buildMessageListWithNeighbours,
  getDefaultDateSeparators,
  MessageListItemWithNeighbours,
  resolveDateSeparatorDates,
} from '../utils/buildMessageListWithNeighbours';

const at = (day: number, hour = 10) => new Date(Date.UTC(2026, 0, day, hour, 0, 0));

const createMessage = (id: string, day = 1) =>
  ({
    created_at: at(day),
    id,
    text: id,
  }) as LocalMessage;

const createSystemMessage = (id: string, day = 1) =>
  ({
    created_at: at(day),
    id,
    text: id,
    type: 'system',
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

  it('leaves separator dates unset when the list did not resolve any', () => {
    // the default rule is neighbour-local, so rows derive their own and the list resolves nothing
    const { items } = buildMessageListWithNeighbours(
      [createMessage('m2', 2), createMessage('m1', 1)],
      new Map(),
    );

    expect(items.map((item) => item.dateSeparatorDate)).toEqual([undefined, undefined]);
    expect(items.map((item) => item.nextMessageDateSeparatorDate)).toEqual([undefined, undefined]);
  });

  it('carries resolved separator dates through, including the next row own date', () => {
    const m2 = createMessage('m2', 2);
    const m1 = createMessage('m1', 1);

    const { items } = buildMessageListWithNeighbours([m2, m1], new Map(), [
      m2.created_at,
      m1.created_at,
    ]);
    const [row0, row1] = items as MessageListItemWithNeighbours[];

    expect(row0.dateSeparatorDate).toBe(m2.created_at);
    expect(row1.dateSeparatorDate).toBe(m1.created_at);
    // the list is inverted, so row1's next row is row0
    expect(row1.nextMessageDateSeparatorDate).toBe(m2.created_at);
    expect(row0.nextMessageDateSeparatorDate).toBeUndefined();
  });

  it('invalidates a cached row when only its resolved separator changed', () => {
    // An override can move a separator without any neighbour changing, so the resolved date has
    // to take part in the cache comparison or the row would keep rendering a stale separator.
    const m2 = createMessage('m2', 1);
    const m1 = createMessage('m1', 1);

    const firstPass = buildMessageListWithNeighbours([m2, m1], new Map(), [
      undefined,
      m1.created_at,
    ]);
    const secondPass = buildMessageListWithNeighbours([m2, m1], firstPass.nextDerivedItems, [
      m2.created_at,
      undefined,
    ]);

    expect(secondPass.items[0]).not.toBe(firstPass.items[0]);
    expect(secondPass.items[0].previousMessage?.id).toBe('m1');
    expect(secondPass.items[0].dateSeparatorDate).toBe(m2.created_at);
    expect(secondPass.items[1].dateSeparatorDate).toBeUndefined();
  });
});

describe('getDefaultDateSeparators', () => {
  it('dates the first message of each day, system messages included', () => {
    // chronological, oldest first
    const m1 = createMessage('m1', 1);
    const s2 = createSystemMessage('s2', 2);
    const m3 = createMessage('m3', 2);
    const m4 = createMessage('m4', 3);

    expect(getDefaultDateSeparators({ messages: [m1, s2, m3, m4] })).toEqual({
      m1: m1.created_at,
      m4: m4.created_at,
      s2: s2.created_at,
    });
  });

  it('does not date the same day twice', () => {
    const m1 = createMessage('m1', 1);
    const s2 = createSystemMessage('s2', 1);
    const m3 = createMessage('m3', 1);

    expect(getDefaultDateSeparators({ messages: [m1, s2, m3] })).toEqual({ m1: m1.created_at });
  });

  it('dates every day of an all-system list', () => {
    const s1 = createSystemMessage('s1', 1);
    const s2 = createSystemMessage('s2', 2);

    expect(getDefaultDateSeparators({ messages: [s1, s2] })).toEqual({
      s1: s1.created_at,
      s2: s2.created_at,
    });
  });

  it('returns nothing when separators are hidden', () => {
    expect(
      getDefaultDateSeparators({ hideDateSeparators: true, messages: [createMessage('m1', 1)] }),
    ).toEqual({});
  });

  it('handles an empty list', () => {
    expect(getDefaultDateSeparators({ messages: [] })).toEqual({});
  });
});

describe('resolveDateSeparatorDates', () => {
  const m3 = createMessage('m3', 2);
  const s2 = createSystemMessage('s2', 2);
  const m1 = createMessage('m1', 1);
  const inverted = [m3, s2, m1];

  it('hands the override the list oldest first, whichever way the list is ordered', () => {
    const seen: string[][] = [];
    const getDateSeparators = ({ messages }: { messages: LocalMessage[] }) => {
      seen.push(messages.map((message) => message.id));
      return {};
    };

    resolveDateSeparatorDates(inverted, { getDateSeparators, isInverted: true });
    resolveDateSeparatorDates([m1, s2, m3], { getDateSeparators, isInverted: false });

    expect(seen).toEqual([
      ['m1', 's2', 'm3'],
      ['m1', 's2', 'm3'],
    ]);
  });

  it('places separators wherever the override says', () => {
    const getDateSeparators = () => ({ [s2.id]: s2.created_at });

    expect(resolveDateSeparatorDates(inverted, { getDateSeparators, isInverted: true })).toEqual([
      undefined,
      s2.created_at,
      undefined,
    ]);
  });

  it('can suppress every separator', () => {
    expect(
      resolveDateSeparatorDates(inverted, { getDateSeparators: () => ({}), isInverted: true }),
    ).toEqual([undefined, undefined, undefined]);
  });

  it('keeps the message own Date instance when the override returns an equal value', () => {
    // an override that builds its own Date would otherwise break row memoization
    const getDateSeparators = () => ({ [m3.id]: new Date(m3.created_at.getTime()) });

    const [first] = resolveDateSeparatorDates(inverted, { getDateSeparators, isInverted: true });

    expect(first).toBe(m3.created_at);
  });

  it('passes a different Date through untouched', () => {
    const other = new Date(Date.UTC(2020, 5, 5, 5, 0, 0));
    const getDateSeparators = () => ({ [m3.id]: other });

    expect(resolveDateSeparatorDates(inverted, { getDateSeparators, isInverted: true })[0]).toBe(
      other,
    );
  });

  it('forwards hideDateSeparators to the override', () => {
    const getDateSeparators = jest.fn(() => ({}));

    resolveDateSeparatorDates(inverted, {
      getDateSeparators,
      hideDateSeparators: true,
      isInverted: true,
    });

    expect(getDateSeparators).toHaveBeenCalledWith(
      expect.objectContaining({ hideDateSeparators: true }),
    );
  });
});
