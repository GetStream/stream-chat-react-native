import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import debounce from 'lodash/debounce';
import type { Channel, UserFilters, UserResponse } from 'stream-chat';

import { useChatContext, useTranslationContext } from '../../../../contexts';
import { getNotificationErrorOptions } from '../../../../hooks/actions/useChannelActions';
import { useChannelMembersState } from '../../../ChannelList/hooks/useChannelMembersState';
import { useNotificationApi } from '../../../Notifications/hooks/useNotificationApi';

const PAGE_SIZE = 25;
const DEBOUNCE_MS = 200;

export type UseChannelAddMembersResult = {
  clearSearch: () => void;
  hasMore: boolean;
  isAlreadyMember: (userId: string) => boolean;
  isSelected: (userId: string) => boolean;
  loading: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  onChangeSearchText: (text: string) => void;
  results: UserResponse[];
  selectedUsers: UserResponse[];
  toggleUser: (user: UserResponse) => void;
};

/**
 * @experimental This hook is experimental and is subject to change.
 */
export const useChannelAddMembers = ({
  channel,
}: {
  channel: Channel;
}): UseChannelAddMembersResult => {
  const { client } = useChatContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();

  const [results, setResults] = useState<UserResponse[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const queryRef = useRef('');
  const offsetRef = useRef(0);
  const requestIdRef = useRef(0);
  const inFlightRef = useRef(false);

  const members = useChannelMembersState(channel);
  const memberIds = useMemo(() => new Set(Object.keys(members)), [members]);

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
        const filter: UserFilters = {};
        if (query) {
          filter.name = { $autocomplete: query };
        }

        const response = await client.queryUsers(
          filter,
          { name: 1 },
          { limit: PAGE_SIZE, offset: offsetRef.current },
        );

        if (requestId !== requestIdRef.current) return;

        const fetched = response.users ?? [];

        setResults((prev) => {
          if (!append) return fetched;
          const seen = new Set(prev.map((u) => u.id));
          const deduped = fetched.filter((u) => u.id && !seen.has(u.id));
          return deduped.length ? [...prev, ...deduped] : prev;
        });
        offsetRef.current += fetched.length;
        if (fetched.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        addNotification({
          message: t('Failed to load users'),
          options: {
            ...getNotificationErrorOptions(error),
            severity: 'error',
            type: 'api:channel:query-users:failed',
          },
          origin: { context: { channel }, emitter: 'AddChannelMembers' },
        });
      } finally {
        if (requestId === requestIdRef.current) {
          inFlightRef.current = false;
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [client, addNotification, t, channel],
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
      queryRef.current = text;
      debouncedFetchQuery(text);
    },
    [debouncedFetchQuery],
  );

  const clearSearch = useCallback(() => {
    queryRef.current = '';
    debouncedFetchQuery.cancel();
    fetchPageRef.current({ append: false, query: '' });
  }, [debouncedFetchQuery]);

  const loadMore = useCallback(() => {
    if (inFlightRef.current || !hasMore || loading) return;
    fetchPageRef.current({ append: true, query: queryRef.current });
  }, [hasMore, loading]);

  const toggleUser = useCallback((user: UserResponse) => {
    if (!user.id) return;
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (exists) return prev.filter((u) => u.id !== user.id);
      return [...prev, user];
    });
  }, []);

  const selectedIds = useMemo(() => new Set(selectedUsers.map((u) => u.id)), [selectedUsers]);

  const isSelected = useCallback((userId: string) => selectedIds.has(userId), [selectedIds]);

  const isAlreadyMember = useCallback((userId: string) => memberIds.has(userId), [memberIds]);

  return {
    clearSearch,
    hasMore,
    isAlreadyMember,
    isSelected,
    loading,
    loadingMore,
    loadMore,
    onChangeSearchText,
    results,
    selectedUsers,
    toggleUser,
  };
};
