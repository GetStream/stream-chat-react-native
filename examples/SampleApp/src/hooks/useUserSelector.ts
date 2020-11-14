import { useContext, useEffect, useRef, useState } from 'react';
import { UserResponse } from 'stream-chat';
import { AppContext } from '../context/AppContext';
import { LocalUserType } from '../types';

export const useUserSelector = () => {
  const { chatClient } = useContext(AppContext);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<UserResponse[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<
    UserResponse<LocalUserType>[]
  >([]);
  const selectedUserIds = useRef<string[]>([]).current;
  const [initialResults, setInitialResults] = useState<UserResponse[] | null>(
    null,
  );

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
    setResults(initialResults);
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

  const fetchUsers = async (q: string) => {
    setLoading(true);
    const res = await chatClient?.queryUsers(
      {
        name: { $autocomplete: q },
      },
      { last_active: -1 },
      { presence: true },
    );
    setResults(res?.users || initialResults || []);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const res = await chatClient?.queryUsers(
        {
          role: 'user',
        },
        { name: 1 },
        { presence: true },
      );
      setInitialResults(res?.users || []);
      setResults(res?.users || []);
      setLoading(false);
    };

    init();
  }, []);

  /* eslint-disable sort-keys */
  return {
    loading,
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
