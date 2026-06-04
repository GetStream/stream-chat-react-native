import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Channel, ChannelMemberResponse, MemberFilters, MemberSort } from 'stream-chat';

import { useChannelMembersState } from '../../../ChannelList/hooks/useChannelMembersState';

const PAGE_SIZE = 25;

export type UseChannelAllMembersResult = {
  hasMore: boolean;
  loading: boolean;
  loadMore: () => void;
  results: ChannelMemberResponse[];
};

const noop = () => undefined;

/**
 * @experimental This hook is experimental and is subject to change.
 */
export const useChannelAllMembers = ({
  channel,
}: {
  channel: Channel;
}): UseChannelAllMembersResult => {
  const localMembers = useChannelMembersState(channel);

  // Mode is decided once on mount (per channel). If member_count is unknown or matches
  // the locally-loaded count, we return local state and stay reactive to member events.
  // Otherwise we switch into paginated mode for the lifetime of the hook.
  const [mode] = useState<'local' | 'paginated'>(() => {
    const memberCount = channel.data?.member_count;
    const loadedCount = Object.keys(channel.state.members).length;
    return memberCount == null || loadedCount >= memberCount ? 'local' : 'paginated';
  });

  const [results, setResults] = useState<ChannelMemberResponse[]>([]);
  const [loading, setLoading] = useState(mode === 'paginated');
  const [hasMore, setHasMore] = useState(mode === 'paginated');

  const offsetRef = useRef(0);
  const requestIdRef = useRef(0);
  const inFlightRef = useRef(false);

  const fetchPage = useCallback(
    async ({ append }: { append: boolean }) => {
      const requestId = ++requestIdRef.current;
      inFlightRef.current = true;
      setLoading(true);
      if (!append) {
        offsetRef.current = 0;
        setHasMore(true);
      }

      try {
        const filter: MemberFilters = {};
        const sort: MemberSort = { created_at: 1 };
        const response = await channel.queryMembers(filter, sort, {
          limit: PAGE_SIZE,
          offset: offsetRef.current,
        });

        if (requestId !== requestIdRef.current) return;

        const fetched = response.members ?? [];
        setResults((prev) => {
          if (!append) return fetched;
          const seen = new Set(prev.map((m) => m.user_id ?? m.user?.id));
          const deduped = fetched.filter((m) => !seen.has(m.user_id ?? m.user?.id));
          return deduped.length ? [...prev, ...deduped] : prev;
        });
        offsetRef.current += fetched.length;
        if (fetched.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        console.warn('[useChannelAllMembers] queryMembers failed', err);
      } finally {
        if (requestId === requestIdRef.current) {
          inFlightRef.current = false;
          setLoading(false);
        }
      }
    },
    [channel],
  );

  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  useEffect(() => {
    if (mode !== 'paginated') return;
    fetchPageRef.current({ append: false });
    return () => {
      requestIdRef.current += 1;
    };
  }, [mode]);

  const loadMore = useCallback(() => {
    if (mode !== 'paginated') return;
    if (inFlightRef.current || !hasMore || loading) return;
    fetchPageRef.current({ append: true });
  }, [mode, hasMore, loading]);

  const localResults = useMemo(() => Object.values(localMembers), [localMembers]);

  if (mode === 'local') {
    return {
      hasMore: false,
      loading: false,
      loadMore: noop,
      results: localResults,
    };
  }

  return { hasMore, loading, loadMore, results };
};
