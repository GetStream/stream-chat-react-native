import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { AppTheme, LocalUserType } from '../../types';
import { UserResponse } from 'stream-chat';
import { Text } from 'react-native';
import { EmptySearchState } from '../../icons/EmptySearchState';
import { Avatar } from '../../../../../src/v2';
import { CheckSend } from '../../icons/CheckSend';
import Dayjs from 'dayjs';

type UserSearchResultsProps = {
  results: UserResponse[];
  selectedUserIds: string[];
  toggleSelectedUser: (user: UserResponse<LocalUserType>) => void;
  groupedAlphabetically?: boolean;
  loading?: boolean;
  searchText?: string;
  showOnlineStatus?: boolean;
};

export const UserSearchResults: React.FC<UserSearchResultsProps> = ({
  groupedAlphabetically = true,
  loading = false,
  results,
  searchText,
  selectedUserIds,
  showOnlineStatus = true,
  toggleSelectedUser,
}) => {
  const [sections, setSections] = useState([]);
  const { colors } = useTheme() as AppTheme;

  useEffect(() => {
    const sections: Record<
      string,
      {
        data: UserResponse[];
        title: string;
      }
    > = {};

    results.forEach((user, index) => {
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

    // @ts-ignore
    setSections(Object.values(sections));
  }, [results]);

  return (
    <View style={{ flexGrow: 1, flexShrink: 1 }}>
      {groupedAlphabetically && (
        <View
          style={{
            backgroundColor: colors.backgroundFadeGradient,
            padding: 5,
            paddingLeft: 8,
          }}
        >
          <Text
            style={{
              color: colors.text,
            }}
          >
            {searchText ? `Matches for "${searchText}"` : 'On the platform'}
          </Text>
        </View>
      )}
      {loading && results.length === 0 && searchText === '' ? (
        <ActivityIndicator size='small' />
      ) : (
        <SectionList<UserResponse<LocalUserType>>
          keyboardDismissMode='none'
          keyboardShouldPersistTaps='always'
          ListEmptyComponent={() => (
            <View style={styles.emptyResultIndicator}>
              <EmptySearchState height={124} width={124} />
              <Text>No user matches these keywords</Text>
              <Text>{loading ? 'true' : 'false'}</Text>
              <Text>{results.length}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                // TODO: Add logic for checking for duplicates
                toggleSelectedUser(item);
              }}
              style={[
                styles.searchResultContainer,
                {
                  borderBottomColor: colors.borderLight,
                  borderBottomWidth: 1,
                },
              ]}
            >
              <Avatar image={item.image} name={item.name} size={40} />
              <View style={styles.searchResultUserDetails}>
                <Text
                  style={[
                    styles.searchResultUserName,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {item.name}
                </Text>
                {showOnlineStatus && (
                  <Text
                    style={[
                      styles.searchResultUserLastOnline,
                      {
                        color: colors.textLight,
                      },
                    ]}
                  >
                    Last online {Dayjs(item.last_active).calendar()}
                  </Text>
                )}
              </View>
              {selectedUserIds.indexOf(item.id) > -1 && (
                <View>
                  <CheckSend height={24} width={24} />
                </View>
              )}
            </TouchableOpacity>
          )}
          renderSectionHeader={({ section: { title } }) => {
            if (searchText || !groupedAlphabetically) {
              return null;
            }

            return (
              <Text
                style={{
                  backgroundColor: colors.greyContentBackground,
                  color: colors.textLight,
                  padding: 6,
                }}
              >
                {title.toUpperCase()}
              </Text>
            );
          }}
          sections={sections}
          stickySectionHeadersEnabled
        />
      )}
    </View>
  );
};

/* eslint-disable sort-keys */
const styles = StyleSheet.create({
  searchContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
  },
  searchContainerLabel: {
    fontSize: 15,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 4,
  },
  inputBoxContainer: {
    flexDirection: 'row',
    margin: 4,
    width: '100%',
  },
  inputBox: {
    flex: 1,
    marginRight: 2,
  },
  searchResultContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 8,
    paddingTop: 13,
    paddingBottom: 13,
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
