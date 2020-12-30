import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Dayjs from 'dayjs';
import { Avatar, useTheme } from 'stream-chat-react-native/v2';

import { CheckSend } from '../../icons/CheckSend';
import { EmptySearchState } from '../../icons/EmptySearchState';

import type { UserResponse } from 'stream-chat';

import type { LocalUserType } from '../../types';
import { Search } from '../../icons/Search';

type UserSearchResultsProps = {
  results: UserResponse[];
  selectedUserIds: string[];
  toggleSelectedUser: (user: UserResponse<LocalUserType>) => void;
  groupedAlphabetically?: boolean;
  loading?: boolean;
  loadMore?: () => void;
  searchText?: string;
  showOnlineStatus?: boolean;
};

export const UserSearchResults: React.FC<UserSearchResultsProps> = ({
  groupedAlphabetically = true,
  loading = false,
  loadMore = () => null,
  results,
  searchText,
  selectedUserIds,
  showOnlineStatus = true,
  toggleSelectedUser,
}) => {
  const [sections, setSections] = useState([]);
  const {
    theme: {
      colors: { black, border, grey, grey_gainsboro, white_smoke, white_snow },
    },
  } = useTheme();

  useEffect(() => {
    const newSections: Record<
      string,
      {
        data: UserResponse[];
        title: string;
      }
    > = {};

    results.forEach((user) => {
      const initial = user.name?.toLowerCase().slice(0, 1);

      if (!initial) return;

      if (!newSections[initial]) {
        newSections[initial] = {
          data: [user],
          title: initial,
        };
      } else {
        newSections[initial].data.push(user);
      }
    });
    // @ts-ignore
    setSections(Object.values(newSections));
  }, [results]);

  return (
    <View style={{ backgroundColor: white_snow, flexGrow: 1, flexShrink: 1 }}>
      {groupedAlphabetically && sections.length > 0 && (
        <View
          style={{
            padding: 5,
            paddingLeft: 8,
          }}
        >
          <Text
            style={{
              color: black,
            }}
          >
            {searchText ? `Matches for "${searchText}"` : 'On the platform'}
          </Text>
        </View>
      )}
      {loading && (!results || results.length === 0) && searchText === '' ? (
        <ActivityIndicator size='small' />
      ) : (
        <SectionList<UserResponse<LocalUserType>>
          keyboardDismissMode='interactive'
          keyboardShouldPersistTaps='handled'
          ListEmptyComponent={() => (
            <View style={styles.emptyResultIndicator}>
              <Search fill={grey_gainsboro} scale={5} />
              <Text style={[{ color: grey }, styles.emptyResultIndicatorText]}>
                {loading ? 'Loading...' : 'No user matches these keywords...'}
              </Text>
            </View>
          )}
          onEndReached={() => {
            loadMore();
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => {
                // TODO: Add logic for checking for duplicates
                toggleSelectedUser(item);
              }}
              style={[
                styles.searchResultContainer,
                {
                  borderBottomColor: border,
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
                      color: black,
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
                        color: grey,
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
                key={title}
                style={{
                  backgroundColor: white_smoke,
                  color: grey,
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
    marginTop: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyResultIndicatorText: {
    marginTop: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
