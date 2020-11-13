import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { UserResponse } from 'stream-chat';
import { AppContext } from '../context/AppContext';
import { LocalUserType } from '../types';
export const useUserSelector = () => {
  const { chatClient } = useContext(AppContext);
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<UserResponse[]>([]);
  const [sectionData, setSectionData] = useState([]);
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

  const onFocusInput = async () => {
    if (!searchText) {
      setResults(initialResults || []); // <-- here
    } else {
      const res = await chatClient?.queryUsers(
        {
          name: { $autocomplete: searchText },
        },
        { last_active: -1 },
        { presence: true },
      );
      setResults(res?.users || initialResults || []);
    }
  };

  const onChangeSearchText = async (text: string) => {
    setSearchText(text);
    if (!text) {
      return setResults(initialResults || []); // <-- here
    }
    const res = await chatClient?.queryUsers(
      {
        name: { $autocomplete: text },
      },
      { last_active: -1 },
      { presence: true },
    );

    setResults(res?.users || initialResults || []);
    setSectionData(getSections(res?.users || initialResults || []));
  };

  const getSections = (result: UserResponse[]) => {
    const sections: Record<
      string,
      {
        data: UserResponse[];
        title: string;
      }
    > = {};

    result.forEach((user, index) => {
      const initial = user.name?.toLowerCase().slice(0, 1);

      if (!initial) return;

      if (!sections[initial]) {
        sections[initial] = {
          data: [user],
          title: initial,
        };
      } else {
        sections[initial].data.push(user);
      }
    });

    return Object.values(sections);
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
    };

    init();
  }, []);

  /* eslint-disable sort-keys */
  return {
    searchText,
    setSearchText,
    sectionData,
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
