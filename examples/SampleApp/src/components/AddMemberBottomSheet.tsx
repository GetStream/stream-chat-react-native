import React from 'react';
import { useTheme } from '@react-navigation/native';
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Channel, UserResponse } from 'stream-chat';
import { usePaginatedUsers } from '../hooks/usePaginatedUsers';
import { CircleClose } from '../icons/CircleClose';
import { Search } from '../icons/Search';

import {
  AppTheme,
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
} from '../types';
import { UserSearchResultsGrid } from './UserSearch/UserSearchResultsGrid';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

  const { colors } = useTheme() as AppTheme;
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
        height: 300,
        marginBottom: insets.bottom,
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
              borderColor: colors.border,
            },
          ]}
        >
          <Search height={24} width={24} />
          <TextInput
            onChangeText={onChangeSearchText}
            onFocus={onFocusInput}
            placeholder={'Search'}
            placeholderTextColor={colors.textLight}
            style={[
              styles.inputBox,
              {
                color: colors.text,
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
              backgroundColor: colors.greyContentBackground,
              flexDirection: 'row',
              padding: 5,
              width: '100%',
            }}
          >
            <ActivityIndicator size={'small'} />
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
              backgroundColor: colors.danger,
              flexDirection: 'row',
              padding: 5,
              width: '100%',
            }}
          >
            <Text
              style={{
                color: colors.textInverted,
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
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    height: 300,
    paddingHorizontal: 16,
    width: '100%',
  },
  inputBox: {
    flex: 1,
    marginLeft: 10,
    padding: 0,
  },
  inputBoxContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
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
  searchContainer: {
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    display: 'flex',
    flexDirection: 'row',
  },
});
