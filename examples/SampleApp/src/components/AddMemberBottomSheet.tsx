import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { TouchableOpacity } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleClose, Search, useTheme } from 'stream-chat-react-native';

import { UserSearchResultsGrid } from './UserSearch/UserSearchResultsGrid';

import { useAppOverlayContext } from '../context/AppOverlayContext';
import {
  isAddMemberBottomSheetData,
  useBottomSheetOverlayContext,
} from '../context/BottomSheetOverlayContext';
import { usePaginatedUsers } from '../hooks/usePaginatedUsers';

import type { UserResponse } from 'stream-chat';

import { StreamChatGenerics } from '../types';

const styles = StyleSheet.create({
  container: {
    height: 300,
  },
  flex: {
    flex: 1,
  },
  inputBox: {
    flex: 1,
    fontSize: 14,
    includeFontPadding: false, // for android vertical text centering
    marginLeft: 10,
    padding: 0, // removal of default text input padding on android
    paddingTop: 0, // removal of iOS top padding for weird centering
    textAlignVertical: 'center', // for android vertical text centering
  },
  inputBoxContainer: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    marginRight: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 16,
  },
  text: {
    marginLeft: 10,
  },
  textContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 5,
    width: '100%',
  },
});

export const AddMemberBottomSheet: React.FC = () => {
  const { setOverlay } = useAppOverlayContext();
  const { data, reset } = useBottomSheetOverlayContext();

  const channel = data && isAddMemberBottomSheetData(data) ? data.channel : undefined;

  const insets = useSafeAreaInsets();

  const {
    theme: {
      colors: { accent_red, black, grey, grey_whisper, white, white_smoke },
    },
  } = useTheme('AddMemberBottomSheet');
  const {
    clearText,
    loading: loadingResults,
    loadMore,
    onChangeSearchText,
    onFocusInput,
    results,
    searchText,
  } = usePaginatedUsers();

  const [addMemberQueryInProgress, setAddMemberQueryInProgress] = useState(false);
  const [error, setError] = useState(false);

  if (!channel) {
    return null;
  }

  const addMember = async (user: UserResponse<StreamChatGenerics>) => {
    setAddMemberQueryInProgress(true);

    try {
      await channel.addMembers([user.id]);
      reset();
      setOverlay('none');
    } catch (err) {
      setError(true);
    }
    setAddMemberQueryInProgress(false);
  };

  return (
    <View
      style={[
        styles.container,
        {
          marginBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.inputRow}>
        <View
          style={[
            styles.inputBoxContainer,
            {
              backgroundColor: white,
              borderColor: grey_whisper,
            },
          ]}
        >
          <Search pathFill={black} />
          <TextInput
            onChangeText={onChangeSearchText}
            onFocus={onFocusInput}
            placeholder='Search'
            placeholderTextColor={grey}
            style={[
              styles.inputBox,
              {
                color: black,
              },
            ]}
            value={searchText}
          />
        </View>
        <TouchableOpacity onPress={clearText}>
          <CircleClose pathFill={grey} />
        </TouchableOpacity>
      </View>
      <View style={styles.flex}>
        {addMemberQueryInProgress && (
          <View
            style={[
              styles.textContainer,
              {
                backgroundColor: white_smoke,
              },
            ]}
          >
            <ActivityIndicator size='small' />
            <Text style={styles.text}>Adding user to channel</Text>
          </View>
        )}
        {error && (
          <View
            style={[
              styles.textContainer,
              {
                backgroundColor: accent_red,
              },
            ]}
          >
            <Text
              style={[
                styles.text,
                {
                  color: white,
                },
              ]}
            >
              Error adding user to channel
            </Text>
          </View>
        )}

        <UserSearchResultsGrid
          loading={loadingResults}
          loadMore={loadMore}
          onPress={addMember}
          results={results}
          searchText={searchText}
        />
      </View>
    </View>
  );
};
