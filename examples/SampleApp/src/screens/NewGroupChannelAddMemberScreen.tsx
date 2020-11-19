/* eslint-disable sort-keys */
import { useNavigation, useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useContext } from 'react';
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Avatar, ThemeProvider } from '../../../../src/v2';
import { ScreenHeader } from '../components/ScreenHeader';
import { UserSearchResults } from '../components/UserSearch/UserSearchResults';
import { AppContext } from '../context/AppContext';
import { usePaginatedUsers } from '../hooks/usePaginatedUsers';
import { Close } from '../icons/Close';
import { RightArrow } from '../icons/RightArrow';
import { Search } from '../icons/Search';
import { AppTheme, StackNavigatorParamList } from '../types';

export type NewGroupChannelAddMemberScreenNavigationProp = StackNavigationProp<
  StackNavigatorParamList,
  'NewGroupChannelAddMemberScreen'
>;

export const NewGroupChannelAddMemberScreen: React.FC = () => {
  const { colors } = useTheme() as AppTheme;
  const navigation = useNavigation<
    NewGroupChannelAddMemberScreenNavigationProp
  >();
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
          title={'Add Group Members'}
        />
        <View style={{ flexGrow: 1, flexShrink: 1 }}>
          <View
            style={[
              styles.searchContainer,
              {
                borderBottomColor: colors.borderLight,
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
              <View style={styles.selectedUsersContainer}>
                <FlatList
                  data={selectedUsers}
                  horizontal
                  renderItem={({ item: user }) => (
                    <TouchableOpacity
                      key={user.id}
                      onPress={() => {
                        toggleUser?.(user);
                      }}
                      style={styles.selectedUserItem}
                    >
                      <Avatar image={user.image} size={64} />
                      <View
                        style={[
                          styles.selectedUserRemoveIcon,
                          {
                            backgroundColor: colors.background,
                          },
                        ]}
                      >
                        <Close height={24} width={24} />
                      </View>
                    </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
  },
  navigationButton: {
    padding: 15,
  },
  searchContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
  },
  inputBoxContainer: {
    flexDirection: 'row',
    margin: 8,
    padding: 10,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: 'white',
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  inputBox: {
    flex: 1,
    marginLeft: 10,
    padding: 0,
  },

  selectedUsersContainer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedUserItem: {
    margin: 8,
  },
  selectedUserRemoveIcon: {
    borderRadius: 15,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    right: -2,
    top: -2,
    height: 24,
    width: 24,
  },
});
