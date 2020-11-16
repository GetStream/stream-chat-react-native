import { useContext, useEffect, useRef, useState } from 'react';
import { QueryFilter, UserFilters, UserResponse } from 'stream-chat';
import { AppContext } from '../context/AppContext';
import { LocalUserType } from '../types';

export const usePaginatedUsers = () => {
  const { chatClient } = useContext(AppContext);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<UserResponse<LocalUserType>[]>([]);
  let offset = useRef(0).current;
  let hasMoreResults = useRef(true).current;
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
    setLoading(true);
    try {
      const filter: UserFilters = {
        role: 'user',
      };

      if (q) filter.name = { $autocomplete: q };

      if (q !== searchText) {
        offset = 0;
        hasMoreResults = true;
      } else {
        offset = offset + results.length;
      }

      if (!hasMoreResults) return;

      console.warn(offset, q, searchText);
      const res = await chatClient?.queryUsers(
        filter,
        { name: 1, id: 1 },
        {
          limit: 10,
          offset,
          presence: true,
        },
      );

      if (!res?.users) return;

      // Dumb check to avoid duplicates
      if (
        q === searchText &&
        results.findIndex((r) => res?.users[0].id === r.id) > -1
      ) {
        console.warn('repeated >?>>>>>')
        return;
      }

      setResults((r) => {
        if (q !== searchText) {
          return res?.users;
        }
        return r.concat(res?.users || []);
      });

      if (res?.users.length < 10) {
        hasMoreResults = false;
      }

      if (!q && offset === 0) {
        setInitialResults(res?.users || []);
      }
    } catch (e) {
      // do nothing;
    }

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
