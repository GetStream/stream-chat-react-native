import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'stream-chat-react-native/v2';

import { UserSearchResultsGrid } from './UserSearch/UserSearchResultsGrid';

import { usePaginatedUsers } from '../hooks/usePaginatedUsers';
import { CircleClose } from '../icons/CircleClose';
import { Search } from '../icons/Search';

import type { Channel, UserResponse } from 'stream-chat';

import type {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
} from '../types';

export type AddMemberBottomSheetProps = {
  channel: Channel<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalReactionType,
    LocalUserType
  >;
  dismissHandler: () => void;
};

export const AddMemberBottomSheet = (props: AddMemberBottomSheetProps) => {
  const { channel, dismissHandler } = props;
  const insets = useSafeAreaInsets();

  const {
    theme: {
      colors: { accent_red, black, border, grey, white, white_smoke },
    },
  } = useTheme();
  const {
    clearText,
    loading: loadingResults,
    loadMore,
    onChangeSearchText,
    onFocusInput,
    results,
    searchText,
  } = usePaginatedUsers();

  const [addMemberQueryInProgress, setAddMemberQueryInProgress] = useState(
    false,
  );
  const [error, setError] = useState(false);
  const addMember = async (user: UserResponse<LocalUserType>) => {
    setAddMemberQueryInProgress(true);

    try {
      await channel.addMembers([user.id]);
      dismissHandler();
    } catch (e) {
      setError(true);
    }
    setAddMemberQueryInProgress(false);
  };

  return (
    <View
      style={{
        flexGrow: 1,
        flexShrink: 1,
        height: 334,
      }}
    >
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        }}
      >
        <View
          style={[
            styles.inputBoxContainer,
            {
              backgroundColor: white,
              borderColor: border,
            },
          ]}
        >
          <Search height={24} width={24} />
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
        {!!searchText && (
          <TouchableOpacity
            onPress={() => {
              clearText();
            }}
            style={{
              marginHorizontal: 4,
            }}
          >
            <CircleClose height={24} width={24} />
          </TouchableOpacity>
        )}
      </View>
      <View
        style={{
          flexGrow: 1,
          flexShrink: 1,
        }}
      >
        {addMemberQueryInProgress && (
          <View
            style={{
              alignItems: 'center',
              backgroundColor: white_smoke,
              flexDirection: 'row',
              padding: 5,
              width: '100%',
            }}
          >
            <ActivityIndicator size='small' />
            <Text
              style={{
                marginLeft: 10,
              }}
            >
              Adding user to channel
            </Text>
          </View>
        )}
        {error && (
          <View
            style={{
              alignItems: 'center',
              backgroundColor: accent_red,
              flexDirection: 'row',
              padding: 5,
              width: '100%',
            }}
          >
            <Text
              style={{
                color: white,
                marginLeft: 10,
              }}
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

AddMemberBottomSheet.displayName = 'AddMemberBottomSheet';

const styles = StyleSheet.create({
  inputBox: {
    flex: 1,
    marginLeft: 10,
    padding: 0,
  },
  inputBoxContainer: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
    margin: 8,
    padding: 10,
    paddingBottom: 8,
    paddingTop: 8,
  },
});
