import React, { useEffect, useRef, useState } from 'react';

import { useAppContext } from '../context/AppContext';

import type { UserFilters, UserResponse } from 'stream-chat';

import type { StreamChatGenerics } from '../types';

export type PaginatedUsers = {
  clearText: () => void;
  initialResults: UserResponse<StreamChatGenerics>[] | null;
  loading: boolean;
  loadMore: () => void;
  onChangeSearchText: (newText: string) => void;
  onFocusInput: () => void;
  removeUser: (index: number) => void;
  reset: () => void;
  results: UserResponse<StreamChatGenerics>[];
  searchText: string;
  selectedUserIds: string[];
  selectedUsers: UserResponse<StreamChatGenerics>[];
  setInitialResults: React.Dispatch<
    React.SetStateAction<UserResponse<StreamChatGenerics>[] | null>
  >;
  setResults: React.Dispatch<React.SetStateAction<UserResponse<StreamChatGenerics>[]>>;
  setSearchText: React.Dispatch<React.SetStateAction<string>>;
  setSelectedUsers: React.Dispatch<React.SetStateAction<UserResponse<StreamChatGenerics>[]>>;
  toggleUser: (user: UserResponse<StreamChatGenerics>) => void;
};

export const usePaginatedUsers = (): PaginatedUsers => {
  const { chatClient } = useAppContext();

  const [initialResults, setInitialResults] = useState<UserResponse<StreamChatGenerics>[] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<UserResponse<StreamChatGenerics>[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserResponse<StreamChatGenerics>[]>([]);

  const hasMoreResults = useRef(true);
  const offset = useRef(0);
  const queryInProgress = useRef(false);

  const reset = () => {
    setSearchText('');
    fetchUsers('');
    setSelectedUserIds([]);
    setSelectedUsers([]);
  };

  const addUser = (user: UserResponse<StreamChatGenerics>) => {
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

  const toggleUser = (user: UserResponse<StreamChatGenerics>) => {
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
      const filter: UserFilters = {
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

      const { users } = await chatClient?.queryUsers(
        filter,
        { name: 1 },
        {
          limit: 10,
          offset: offset.current,
          presence: true,
        },
      );

      const usersWithoutClientUserId = users.filter((user) => user.id !== chatClient.userID);

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
