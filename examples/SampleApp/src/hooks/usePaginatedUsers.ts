import { useContext, useEffect, useRef, useState } from 'react';
import { UserFilters, UserResponse } from 'stream-chat';
import { AppContext } from '../context/AppContext';
import { LocalUserType } from '../types';

export const usePaginatedUsers = () => {
  const { chatClient } = useContext(AppContext);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<UserResponse<LocalUserType>[]>([]);
  const offset = useRef(0);
  const hasMoreResults = useRef(true);
  const queryInProgress = useRef(false);
  const [selectedUsers, setSelectedUsers] = useState<
    UserResponse<LocalUserType>[]
  >([]);
  const selectedUserIds = useRef<string[]>([]).current;
  const [initialResults, setInitialResults] = useState<
    UserResponse<LocalUserType>[] | null
  >(null);

  const toggleUser = (user: UserResponse<LocalUserType>) => {
    if (!user || !user.name) {
      return;
    }

    const existingIndex = selectedUserIds.indexOf(user.id);
    if (existingIndex > -1) {
      removeUser(existingIndex);
    } else {
      addUser(user);
    }
  };

  const addUser = (user: UserResponse<LocalUserType>) => {
    const newSelectedUsers = [...selectedUsers, user];
    setSelectedUsers(newSelectedUsers);
    selectedUserIds.push(user.id);
    setSearchText('');
    setResults(initialResults || []);
  };

  const removeUser = (index: number) => {
    if (index < 0) {
      return;
    }

    // TODO: Fix this ... replace with splice
    const newSelectedUsers = [
      ...selectedUsers.slice(0, index),
      ...selectedUsers.slice(index + 1),
    ];
    selectedUserIds.splice(index, 1);
    setSelectedUsers(newSelectedUsers);
  };

  const onFocusInput = () => {
    if (!searchText) {
      setResults(initialResults || []); // <-- here
      setLoading(false);
      return;
    }

    fetchUsers(searchText);
  };

  const onChangeSearchText = (newText: string) => {
    setSearchText(newText);
    if (!newText) {
      setResults(initialResults || []); // <-- here
      setLoading(false);
    } else {
      fetchUsers(newText);
    }
  };

  const fetchUsers = async (q = '') => {
    if (queryInProgress.current) return;
    setLoading(true);

    try {
      queryInProgress.current = true;
      const filter: UserFilters = {
        role: 'user',
      };

      if (q) filter.name = { $autocomplete: q };

      if (q !== searchText) {
        offset.current = 0;
        hasMoreResults.current = true;
      } else {
        offset.current = offset.current + results.length;
      }

      if (!hasMoreResults.current) {
        queryInProgress.current = false;
        return;
      }

      const res = await chatClient?.queryUsers(
        filter,
        { name: 1 },
        {
          limit: 10,
          offset: offset.current,
          presence: true,
        },
      );
      if (!res?.users) {
        queryInProgress.current = false;
        return;
      }

      // Dumb check to avoid duplicates
      if (
        q === searchText &&
        results.findIndex((r) => res?.users[0].id === r.id) > -1
      ) {
        queryInProgress.current = false;
        return;
      }

      setResults((r) => {
        if (q !== searchText) {
          return res?.users;
        }
        return r.concat(res?.users || []);
      });

      if (
        res?.users.length < 10 &&
        (offset.current === 0 || q === searchText)
      ) {
        hasMoreResults.current = false;
      }

      if (!q && offset.current === 0) {
        setInitialResults(res?.users || []);
      }
    } catch (e) {
      // do nothing;
    }
    queryInProgress.current = false;
    setLoading(false);
  };

  const loadMore = () => {
    fetchUsers(searchText);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* eslint-disable sort-keys */
  return {
    clearText: () => {
      setSearchText('');
      fetchUsers('');
    },
    loading,
    loadMore,
    searchText,
    setSearchText,
    results,
    setResults,
    selectedUsers,
    setSelectedUsers,
    selectedUserIds,
    initialResults,
    setInitialResults,
    toggleUser,
    onChangeSearchText,
    onFocusInput,
  };
};
