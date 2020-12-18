import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Channel } from 'stream-chat';
import { KeyboardCompatibleView } from '../../../../src/v2';
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

export const AddMemberBottomSheet: React.FC<AddMemberBottomSheetProps> = ({
  channel,
  dismissHandler,
}) => {
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
  const addMember = async (user) => {
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
    <KeyboardCompatibleView keyboardVerticalOffset={0}>
      <View
        style={{
          flexGrow: 1,
          flexShrink: 1,
          padding: 10,
        }}
      >
        <View style={[styles.container, {}]}>
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
                autoFocus
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
                  width: '100%',
                  flexDirection: 'row',
                  backgroundColor: colors.greyContentBackground,
                  padding: 5,
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
                  width: '100%',
                  flexDirection: 'row',
                  backgroundColor: colors.danger,
                  padding: 5,
                }}
              >
                <Text
                  style={{
                    marginLeft: 10,
                    color: colors.textInverted
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
      </View>
    </KeyboardCompatibleView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    height: 300,
    width: '100%',
    paddingHorizontal: 16,
  },
  inputBox: {
    flex: 1,
    marginLeft: 10,
    padding: 0,
  },
  inputBoxContainer: {
    flexGrow: 1,
    flexShrink: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
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
