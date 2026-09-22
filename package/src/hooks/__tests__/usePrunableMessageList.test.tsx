import { act, renderHook } from '@testing-library/react-native';

import type { Channel, LocalMessage } from 'stream-chat';

import { initiateClientWithChannels } from '../../mock-builders/api/initiateClientWithChannels';
import { generateMessage } from '../../mock-builders/generator/message';
import { convertDateToTimestamp } from '../../mock-builders/generator/time';
import { usePrunableMessageList } from '../usePrunableMessageList';

const viewable = (indices: number[]) =>
  indices.map((index) => ({ index, isViewable: true, item: {}, key: String(index) }));

describe('usePrunableMessageList', () => {
  let channel: Channel;

  const seed = (count: number) =>
    channel.messagePaginator.ingestPage({
      page: Array.from({ length: count }, (_, i) =>
        channel.state.formatMessage(
          generateMessage({
            cid: channel.cid,
            created_at: convertDateToTimestamp(
              `2020-01-01T00:${String(i).padStart(2, '0')}:00.000Z`,
            ),
            id: `m${i}`,
          }),
        ),
      ) as LocalMessage[],
      isHead: true,
      isTail: false,
      setActive: true,
    });

  beforeEach(async () => {
    const { channels } = await initiateClientWithChannels();
    channel = channels[0];
    channel.messagePaginator.updateConfig({ maxLoadedItems: 10, pageSize: 5 });
  });

  it('reports the cap the paginator is configured with', () => {
    const { result } = renderHook(() =>
      usePrunableMessageList({ paginator: channel.messagePaginator }),
    );
    expect(result.current.maxLoadedItems).toBe(10);
  });

  it('suspends pruning while the viewport is near the oldest loaded message', () => {
    const spy = jest.spyOn(channel.messagePaginator, 'setPruningSuspended');
    const { result } = renderHook(() =>
      usePrunableMessageList({ paginator: channel.messagePaginator }),
    );

    // Inverted list: a high index is the OLD end. Within 20% of the cap ⇒ not safe to prune there.
    act(() => {
      result.current.viewabilityChangedCallback({
        inverted: true,
        viewableItems: viewable([8, 9]),
      });
    });
    expect(spy).toHaveBeenLastCalledWith(true);

    // Back at the newest end ⇒ the suspension lifts.
    act(() => {
      result.current.viewabilityChangedCallback({
        inverted: true,
        viewableItems: viewable([0, 1]),
      });
    });
    expect(spy).toHaveBeenLastCalledWith(false);
  });

  it('reads the non-inverted (FlashList) axis the other way round', () => {
    const spy = jest.spyOn(channel.messagePaginator, 'setPruningSuspended');
    const { result } = renderHook(() =>
      usePrunableMessageList({ paginator: channel.messagePaginator }),
    );

    // Non-inverted: index 0 is the OLD end.
    act(() => {
      result.current.viewabilityChangedCallback({
        inverted: false,
        viewableItems: viewable([0, 1]),
      });
    });
    expect(spy).toHaveBeenLastCalledWith(true);

    act(() => {
      result.current.viewabilityChangedCallback({
        inverted: false,
        viewableItems: viewable([8, 9]),
      });
    });
    expect(spy).toHaveBeenLastCalledWith(false);
  });

  it('does nothing at all when the paginator has no cap configured', () => {
    channel.messagePaginator.updateConfig({ maxLoadedItems: undefined });
    const spy = jest.spyOn(channel.messagePaginator, 'setPruningSuspended');
    const { result } = renderHook(() =>
      usePrunableMessageList({ paginator: channel.messagePaginator }),
    );

    act(() => {
      result.current.viewabilityChangedCallback({
        inverted: true,
        viewableItems: viewable([8, 9]),
      });
    });

    expect(result.current.maxLoadedItems).toBeUndefined();
    expect(spy).not.toHaveBeenCalled();
  });

  it('lifts a suspension on unmount, so an unmounted list cannot pin the window open', () => {
    const spy = jest.spyOn(channel.messagePaginator, 'setPruningSuspended');
    const { result, unmount } = renderHook(() =>
      usePrunableMessageList({ paginator: channel.messagePaginator }),
    );

    act(() => {
      result.current.viewabilityChangedCallback({
        inverted: true,
        viewableItems: viewable([8, 9]),
      });
    });
    expect(spy).toHaveBeenLastCalledWith(true);

    unmount();
    expect(spy).toHaveBeenLastCalledWith(false);
  });

  // The hook only decides WHEN; proving the two halves actually meet is what makes it worth having.
  it('the gate really controls the paginator: suspended the window grows, allowed it is capped', () => {
    seed(10);
    const { result } = renderHook(() =>
      usePrunableMessageList({ paginator: channel.messagePaginator }),
    );
    expect(channel.messagePaginator.items).toHaveLength(10);

    act(() => {
      result.current.viewabilityChangedCallback({
        inverted: true,
        viewableItems: viewable([9]),
      });
    });

    const ingest = (i: number) =>
      channel.messagePaginator.ingestItem(
        channel.state.formatMessage(
          generateMessage({
            cid: channel.cid,
            created_at: convertDateToTimestamp(
              `2020-01-02T00:${String(i).padStart(2, '0')}:00.000Z`,
            ),
            id: `n${i}`,
          }),
        ) as LocalMessage,
      );

    for (let i = 0; i < 5; i++) ingest(i);
    // Reading near the oldest message, so nothing was pulled out from under the viewport.
    expect(channel.messagePaginator.items).toHaveLength(15);

    act(() => {
      result.current.viewabilityChangedCallback({
        inverted: true,
        viewableItems: viewable([0]),
      });
    });

    for (let i = 5; i < 10; i++) ingest(i);
    expect(channel.messagePaginator.items).toHaveLength(10);
    expect(channel.messagePaginator.hasMoreTail).toBe(true);
  });
});
