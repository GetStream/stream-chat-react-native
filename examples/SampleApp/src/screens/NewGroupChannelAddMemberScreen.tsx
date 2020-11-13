/* eslint-disable sort-keys */
import { useNavigation, useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useContext } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Avatar, ThemeProvider } from '../../../../src/v2';
import { UserSearchResults } from '../components/UserSearch/UserSearchResults';
import { AppContext } from '../context/AppContext';
import { useUserSelector } from '../hooks/useUserSelector';
import { LeftArrow } from '../icons/LeftArrow';
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
    onChangeSearchText,
    onFocusInput,
    results,
    searchText,
    selectedUserIds,
    selectedUsers,
    toggleUser,
  } = useUserSelector();
  if (!chatClient) return null;

  return (
    <SafeAreaView>
      <ThemeProvider>
        <View
          style={[
            styles.headerContainer,
            {
              backgroundColor: colors.backgroundNavigation,
              borderBottomColor: colors.border,
              borderBottomWidth: 1,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();
            }}
            style={styles.navigationButton}
          >
            <LeftArrow height={24} width={24} />
          </TouchableOpacity>
          <Text style={{ fontWeight: 'bold' }}>Add Group Members</Text>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('NewGroupChannelAssignNameScreen', {
                selectedUsers,
              });
            }}
            style={styles.navigationButton}
          >
            {selectedUsers.length > 0 && <RightArrow height={24} width={24} />}
          </TouchableOpacity>
        </View>
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
                  autoFocus
                  onBlur={() => {
                    // setResults([]);
                  }}
                  onChangeText={onChangeSearchText}
                  onFocus={onFocusInput}
                  placeholder={'Search'}
                  placeholderTextColor={colors.textLight}
                  ref={(ref) => {
                    if (!ref) return;

                    inputRef = ref;
                  }}
                  style={[
                    styles.inputBox,
                    {
                      color: colors.text,
                    },
                  ]}
                  value={searchText}
                />
              </View>
              <View
                style={{
                  alignItems: 'flex-start',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                }}
              >
                <FlatList
                  data={selectedUsers}
                  horizontal
                  renderItem={({ index, item: user }) => (
                    <TouchableOpacity
                      onPress={() => {
                        toggleUser?.(user);
                      }}
                      style={{
                        margin: 8,
                      }}
                    >
                      <Avatar image={user.image} size={64} />
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </View>
          {results && results.length >= 0 && (
            <View style={{ flexGrow: 1, flexShrink: 1 }}>
              <UserSearchResults
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
    </SafeAreaView>
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
  searchResultContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 8,
  },
  searchResultUserImage: {
    height: 30,
    width: 30,
    borderRadius: 20,
  },
  searchResultUserDetails: {
    paddingLeft: 8,
    flexGrow: 1,
    flexShrink: 1,
  },
  searchResultUserName: { fontSize: 14 },
  searchResultUserLastOnline: { fontSize: 12.5 },
  emptyResultIndicator: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyResultIndicatorEmoji: {
    fontSize: 60,
  },
  textInputContainer: {
    minWidth: 100,
    height: 32,
    margin: 4,
    borderRadius: 16,
    backgroundColor: '#ccc',
  },

  textInput: {
    margin: 0,
    padding: 0,
    paddingLeft: 12,
    paddingRight: 12,
    height: 32,
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.87)',
  },
});
