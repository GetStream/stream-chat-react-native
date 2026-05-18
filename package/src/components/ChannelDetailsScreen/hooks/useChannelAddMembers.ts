import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import debounce from 'lodash/debounce';
import type { Channel, UserFilters, UserResponse } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useChannelMembersState } from '../../ChannelList/hooks/useChannelMembersState';

const PAGE_SIZE = 100;
const DEBOUNCE_MS = 200;

export type UseChannelAddMembersResult = {
  clearSearch: () => void;
  hasMore: boolean;
  isSelected: (userId: string) => boolean;
  loading: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  onChangeSearchText: (text: string) => void;
  results: UserResponse[];
  searchText: string;
  selectedUsers: UserResponse[];
  toggleUser: (user: UserResponse) => void;
};

export const useChannelAddMembers = ({
  channel,
}: {
  channel: Channel;
}): UseChannelAddMembersResult => {
  const { client } = useChatContext();

  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<UserResponse[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const offsetRef = useRef(0);
  const requestIdRef = useRef(0);
  const inFlightRef = useRef(false);

  const members = useChannelMembersState(channel);
  const excludedIds = useMemo(() => {
    const ids = new Set<string>(Object.keys(members));
    if (client.userID) ids.add(client.userID);
    return ids;
  }, [members, client.userID]);

  // Avoid fetchPage churning whenever channel.state.members mutates.
  const excludedIdsRef = useRef(excludedIds);
  excludedIdsRef.current = excludedIds;

  const fetchPage = useCallback(
    async ({ append, query }: { append: boolean; query: string }) => {
      const requestId = ++requestIdRef.current;
      inFlightRef.current = true;
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        offsetRef.current = 0;
        setHasMore(true);
      }

      try {
        const filter: UserFilters = { role: 'user' };
        if (query) {
          filter.name = { $autocomplete: query };
        }

        const response = await client.queryUsers(
          filter,
          { name: 1 },
          { limit: PAGE_SIZE, offset: offsetRef.current, presence: true },
        );

        if (requestId !== requestIdRef.current) return;

        const fetched = response.users ?? [];
        const filtered = fetched.filter((user) => user.id && !excludedIdsRef.current.has(user.id));

        setResults((prev) => {
          if (!append) return filtered;
          const seen = new Set(prev.map((u) => u.id));
          const deduped = filtered.filter((u) => !seen.has(u.id));
          return deduped.length ? [...prev, ...deduped] : prev;
        });
        offsetRef.current += fetched.length;
        if (fetched.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        console.warn('[useChannelAddMembers] queryUsers failed', err);
      } finally {
        if (requestId === requestIdRef.current) {
          inFlightRef.current = false;
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [client],
  );

  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  const debouncedFetchQuery = useMemo(
    () =>
      debounce((query: string) => {
        fetchPageRef.current({ append: false, query });
      }, DEBOUNCE_MS),
    [],
  );

  useEffect(() => {
    fetchPageRef.current({ append: false, query: '' });
    return () => {
      debouncedFetchQuery.cancel();
      requestIdRef.current += 1;
    };
  }, [debouncedFetchQuery]);

  const onChangeSearchText = useCallback(
    (text: string) => {
      setSearchText(text);
      debouncedFetchQuery(text);
    },
    [debouncedFetchQuery],
  );

  const clearSearch = useCallback(() => {
    setSearchText('');
    debouncedFetchQuery.cancel();
    fetchPageRef.current({ append: false, query: '' });
  }, [debouncedFetchQuery]);

  const loadMore = useCallback(() => {
    if (inFlightRef.current || !hasMore || loading) return;
    fetchPageRef.current({ append: true, query: searchText });
  }, [hasMore, loading, searchText]);

  const toggleUser = useCallback((user: UserResponse) => {
    if (!user.id) return;
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      return exists ? prev.filter((u) => u.id !== user.id) : [...prev, user];
    });
  }, []);

  const selectedIds = useMemo(() => new Set(selectedUsers.map((u) => u.id)), [selectedUsers]);

  const isSelected = useCallback((userId: string) => selectedIds.has(userId), [selectedIds]);

  return {
    clearSearch,
    hasMore,
    isSelected,
    loading,
    loadingMore,
    loadMore,
    onChangeSearchText,
    results,
    searchText,
    selectedUsers,
    toggleUser,
  };
};
