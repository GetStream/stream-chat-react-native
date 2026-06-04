import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { generateMember } from '../../../../mock-builders/generator/member';
import { generateUser } from '../../../../mock-builders/generator/user';
import { useChannelAllMembers } from '../../hooks/members/useChannelAllMembers';

type QueryMembersMock = jest.Mock<
  Promise<{ members: ChannelMemberResponse[] }>,
  [unknown, unknown, unknown]
>;

const buildChannel = ({
  members,
  memberCount,
  queryMembers,
}: {
  members: ChannelMemberResponse[];
  memberCount?: number;
  queryMembers?: QueryMembersMock;
}): Channel =>
  ({
    cid: 'messaging:test',
    data: memberCount == null ? {} : { member_count: memberCount },
    on: () => ({ unsubscribe: () => undefined }),
    queryMembers: queryMembers ?? jest.fn(),
    state: {
      members: Object.fromEntries(
        members.map((m) => [m.user?.id ?? m.user_id ?? '', m]).filter(([k]) => Boolean(k)),
      ),
    },
  }) as unknown as Channel;

const buildMembers = (count: number, prefix = 'u') =>
  Array.from({ length: count }, (_, i) =>
    generateMember({ user: generateUser({ id: `${prefix}-${i}`, name: `User ${i}` }) }),
  );

describe('useChannelAllMembers', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('local mode', () => {
    it('returns local members when member_count matches the loaded count', () => {
      const members = buildMembers(3);
      const queryMembers: QueryMembersMock = jest.fn();
      const channel = buildChannel({ memberCount: 3, members, queryMembers });

      const { result } = renderHook(() => useChannelAllMembers({ channel }));

      expect(queryMembers).not.toHaveBeenCalled();
      expect(result.current.results.map((m) => m.user?.id)).toEqual(['u-0', 'u-1', 'u-2']);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.loading).toBe(false);
    });

    it('treats undefined member_count as fully loaded', () => {
      const members = buildMembers(2);
      const queryMembers: QueryMembersMock = jest.fn();
      const channel = buildChannel({ members, queryMembers });

      const { result } = renderHook(() => useChannelAllMembers({ channel }));

      expect(queryMembers).not.toHaveBeenCalled();
      expect(result.current.results).toHaveLength(2);
      expect(result.current.hasMore).toBe(false);
    });

    it('loadMore is a no-op in local mode', () => {
      const members = buildMembers(1);
      const queryMembers: QueryMembersMock = jest.fn();
      const channel = buildChannel({ memberCount: 1, members, queryMembers });

      const { result } = renderHook(() => useChannelAllMembers({ channel }));

      act(() => result.current.loadMore());
      expect(queryMembers).not.toHaveBeenCalled();
    });
  });

  describe('paginated mode', () => {
    it('fetches the first page on mount and exposes loading state', async () => {
      const loaded = buildMembers(25, 'loaded');
      const firstPage = buildMembers(25, 'page1');
      const queryMembers: QueryMembersMock = jest.fn().mockResolvedValue({ members: firstPage });
      const channel = buildChannel({ memberCount: 250, members: loaded, queryMembers });

      const { result } = renderHook(() => useChannelAllMembers({ channel }));

      expect(result.current.loading).toBe(true);
      expect(result.current.hasMore).toBe(true);

      await waitFor(() => expect(queryMembers).toHaveBeenCalledTimes(1));
      expect(queryMembers).toHaveBeenCalledWith({}, { created_at: 1 }, { limit: 25, offset: 0 });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.results).toHaveLength(25);
      expect(result.current.results[0]?.user?.id).toBe('page1-0');
      expect(result.current.hasMore).toBe(true);
    });

    it('appends the next page on loadMore with the correct offset and dedupes', async () => {
      const firstPage = buildMembers(25, 'page1');
      const overlap = firstPage[firstPage.length - 1];
      const secondPageFresh = buildMembers(10, 'page2');
      const secondPage = overlap ? [overlap, ...secondPageFresh] : secondPageFresh;
      const queryMembers: QueryMembersMock = jest
        .fn()
        .mockResolvedValueOnce({ members: firstPage })
        .mockResolvedValueOnce({ members: secondPage });
      const channel = buildChannel({
        memberCount: 300,
        members: buildMembers(25, 'loaded'),
        queryMembers,
      });

      const { result } = renderHook(() => useChannelAllMembers({ channel }));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.results).toHaveLength(25);

      act(() => result.current.loadMore());

      await waitFor(() => expect(queryMembers).toHaveBeenCalledTimes(2));
      expect(queryMembers).toHaveBeenNthCalledWith(
        2,
        {},
        { created_at: 1 },
        { limit: 25, offset: 25 },
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.results).toHaveLength(35);
      expect(result.current.hasMore).toBe(false);
    });

    it('marks hasMore=false when the first page is shorter than PAGE_SIZE', async () => {
      const firstPage = buildMembers(10, 'page1');
      const queryMembers: QueryMembersMock = jest.fn().mockResolvedValue({ members: firstPage });
      const channel = buildChannel({
        memberCount: 200,
        members: buildMembers(25, 'loaded'),
        queryMembers,
      });

      const { result } = renderHook(() => useChannelAllMembers({ channel }));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.hasMore).toBe(false);

      act(() => result.current.loadMore());
      expect(queryMembers).toHaveBeenCalledTimes(1);
    });

    it('guards against concurrent loadMore calls', async () => {
      let resolveSecond: ((value: { members: ChannelMemberResponse[] }) => void) | undefined;
      const queryMembers: QueryMembersMock = jest
        .fn()
        .mockResolvedValueOnce({ members: buildMembers(25, 'page1') })
        .mockReturnValueOnce(
          new Promise<{ members: ChannelMemberResponse[] }>((resolve) => {
            resolveSecond = resolve;
          }),
        );
      const channel = buildChannel({
        memberCount: 500,
        members: buildMembers(25, 'loaded'),
        queryMembers,
      });

      const { result } = renderHook(() => useChannelAllMembers({ channel }));

      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.loadMore());
      await waitFor(() => expect(result.current.loading).toBe(true));
      expect(result.current.results.length).toBeGreaterThan(0);

      act(() => result.current.loadMore());
      act(() => result.current.loadMore());

      expect(queryMembers).toHaveBeenCalledTimes(2);

      act(() => resolveSecond?.({ members: buildMembers(25, 'page2') }));
      await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it('recovers from a queryMembers rejection', async () => {
      const queryMembers: QueryMembersMock = jest.fn().mockRejectedValue(new Error('boom'));
      const channel = buildChannel({
        memberCount: 200,
        members: buildMembers(25, 'loaded'),
        queryMembers,
      });

      const { result } = renderHook(() => useChannelAllMembers({ channel }));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.results).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        '[useChannelAllMembers] queryMembers failed',
        expect.any(Error),
      );
    });
  });
});
