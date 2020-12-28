import React, { useContext } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemeProvider, useTheme } from 'stream-chat-react-native/v2';

import { ScreenHeader } from '../components/ScreenHeader';
import { UserGridItem } from '../components/UserSearch/UserGridItem';
import { UserSearchResults } from '../components/UserSearch/UserSearchResults';
import { AppContext } from '../context/AppContext';
import { usePaginatedUsers } from '../hooks/usePaginatedUsers';
import { RightArrow } from '../icons/RightArrow';
import { Search } from '../icons/Search';
import { StackNavigatorParamList } from '../types';

export type NewGroupChannelAddMemberScreenNavigationProp = StackNavigationProp<
  StackNavigatorParamList,
  'NewGroupChannelAddMemberScreen'
>;

export const NewGroupChannelAddMemberScreen: React.FC = () => {
  const {
    theme: {
      colors: { black, border, grey, white },
    },
  } = useTheme();
  const navigation = useNavigation<NewGroupChannelAddMemberScreenNavigationProp>();
  const { chatClient } = useContext(AppContext);
  const {
    loading: loadingResults,
    loadMore,
    onChangeSearchText,
    onFocusInput,
    results,
    searchText,
    selectedUserIds,
    selectedUsers,
    toggleUser,
  } = usePaginatedUsers();

  if (!chatClient) return null;

  return (
    <>
      <ThemeProvider>
        <ScreenHeader
          RightContent={() => (
            <TouchableOpacity
              disabled={selectedUsers.length === 0}
              onPress={() => {
                if (selectedUsers.length === 0) return;

                navigation.navigate('NewGroupChannelAssignNameScreen', {
                  selectedUsers,
                });
              }}
              style={styles.navigationButton}
            >
              {selectedUsers.length > 0 ? (
                <RightArrow height={24} width={24} />
              ) : (
                <View style={{ height: 24, width: 24 }} />
              )}
            </TouchableOpacity>
          )}
          titleText='Add Group Members'
        />
        <View style={{ flexGrow: 1, flexShrink: 1 }}>
          <View
            style={[
              styles.searchContainer,
              {
                borderBottomColor: border,
              },
            ]}
          >
            <View
              style={{
                flexGrow: 1,
                flexShrink: 1,
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
              <View style={styles.selectedUsersContainer}>
                <FlatList
                  data={selectedUsers}
                  horizontal
                  renderItem={({ item: user }) => (
                    <UserGridItem
                      onPress={() => {
                        toggleUser?.(user);
                      }}
                      user={user}
                    />
                  )}
                />
              </View>
            </View>
          </View>
          {results && results.length >= 0 && (
            <View style={{ flexGrow: 1, flexShrink: 1 }}>
              <UserSearchResults
                loading={loadingResults}
                loadMore={loadMore}
                results={results}
                searchText={searchText}
                selectedUserIds={selectedUserIds}
                toggleSelectedUser={(user) => {
                  toggleUser(user);
                }}
              />
            </View>
          )}
        </View>
      </ThemeProvider>
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 56,
    justifyContent: 'space-between',
  },
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
    margin: 8,
    padding: 10,
    paddingBottom: 8,
    paddingTop: 8,
  },
  navigationButton: {
    padding: 15,
  },
  searchContainer: {
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    display: 'flex',
    flexDirection: 'row',
  },
  selectedUserItem: {
    margin: 8,
  },
  selectedUserItemContainer: {
    alignItems: 'center',
    flexDirection: 'column',
    padding: 8,
    width: 80,
  },
  selectedUserItemName: {
    flexWrap: 'wrap',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedUserRemoveIcon: {
    alignItems: 'center',
    borderRadius: 15,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    top: -2,
    width: 24,
  },
  selectedUsersContainer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
