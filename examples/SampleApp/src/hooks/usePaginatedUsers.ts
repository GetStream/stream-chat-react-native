import React, { useEffect, useRef, useState } from 'react';

import { useAppContext } from '../context/AppContext';

export type PaginatedUsers = {
  clearText: () => void;
  initialResults: unknown[] | null;
  loading: boolean;
  loadMore: () => void;
  onChangeSearchText: (newText: string) => void;
  onFocusInput: () => void;
  removeUser: (index: number) => void;
  reset: () => void;
  results: unknown[];
  searchText: string;
  selectedUserIds: string[];
  selectedUsers: unknown[];
  setInitialResults: React.Dispatch<
    React.SetStateAction<unknown[] | null>
  >;
  setResults: React.Dispatch<React.SetStateAction<unknown[]>>;
  setSearchText: React.Dispatch<React.SetStateAction<string>>;
  setSelectedUsers: React.Dispatch<React.SetStateAction<unknown[]>>;
  toggleUser: (user: unknown) => void;
};

export const usePaginatedUsers = (): PaginatedUsers => {
  const { chatClient } = useAppContext();

  const [initialResults, setInitialResults] = useState<unknown[] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<unknown[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<unknown[]>([]);

  const hasMoreResults = useRef(true);
  const offset = useRef(0);
  const queryInProgress = useRef(false);

  const reset = () => {
    setSearchText('');
    fetchUsers('');
    setSelectedUserIds([]);
    setSelectedUsers([]);
  };

  const addUser = (user: unknown) => {
    setSelectedUsers([...selectedUsers, user]);
    setSelectedUserIds((prevSelectedUserIds) => {
      prevSelectedUserIds.push(user.id);
      return prevSelectedUserIds;
    });
    setSearchText('');
    setResults(initialResults || []);
  };

  const removeUser = (index: number) => {
    if (index < 0) {
      return;
    }

    setSelectedUserIds((prevSelectedUserIds) => {
      const newSelectedUserIds = prevSelectedUserIds.slice();
      newSelectedUserIds.splice(index, 1);
      return newSelectedUserIds;
    });

    setSelectedUsers((prevSelectedUsers) => {
      const newSelectedUsers = prevSelectedUsers.slice();
      newSelectedUsers.splice(index, 1);
      return newSelectedUsers;
    });
  };

  const toggleUser = (user: unknown) => {
    if (!user.id) {
      return;
    }

    const existingIndex = selectedUserIds.indexOf(user.id);

    if (existingIndex > -1) {
      removeUser(existingIndex);
    } else {
      addUser(user);
    }
  };

  const onFocusInput = () => {
    if (!searchText) {
      setResults(initialResults || []);
      setLoading(false);
    } else {
      fetchUsers(searchText);
    }
  };

  const onChangeSearchText = (newText: string) => {
    setSearchText(newText);
    if (!newText) {
      setResults(initialResults || []);
      setLoading(false);
    } else {
      fetchUsers(newText);
    }
  };

  const fetchUsers = async (query = '') => {
    if (queryInProgress.current || !chatClient?.userID) {
      return;
    }
    setLoading(true);

    try {
      queryInProgress.current = true;
      const filter = {
        role: 'user',
      };

      if (query) {
        filter.name = { $autocomplete: query };
      }

      if (query !== searchText) {
        offset.current = 0;
        hasMoreResults.current = true;
      } else {
        offset.current = offset.current + results.length;
      }

      if (!hasMoreResults.current) {
        queryInProgress.current = false;
        return;
      }
      const usersWithoutClientUserId = null;

      setResults((r) => {
        if (query !== searchText) {
          return usersWithoutClientUserId;
        }
        return r.concat(usersWithoutClientUserId);
      });

      if (usersWithoutClientUserId.length < 10 && (offset.current === 0 || query === searchText)) {
        hasMoreResults.current = false;
      }

      if (!query && offset.current === 0) {
        setInitialResults(usersWithoutClientUserId);
      }
    } catch (e) {
      // do nothing;
      console.log('Error fetching users', e);
    }
    queryInProgress.current = false;
    setLoading(false);
  };

  const loadMore = () => {
    fetchUsers(searchText);
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    clearText: () => {
      setSearchText('');
      fetchUsers('');
    },
    initialResults,
    loading,
    loadMore,
    onChangeSearchText,
    onFocusInput,
    removeUser,
    reset,
    results,
    searchText,
    selectedUserIds,
    selectedUsers,
    setInitialResults,
    setResults,
    setSearchText,
    setSelectedUsers,
    toggleUser,
  };
};
