import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import dayjs from 'dayjs';

import { useUserSearchContext } from '../../context/UserSearchContext';

import calendar from 'dayjs/plugin/calendar';

dayjs.extend(calendar);

const styles = StyleSheet.create({
  absolute: { position: 'absolute' },
  emptyResultIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 28,
  },
  emptyResultIndicatorText: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 28,
  },
  flex: { flex: 1 },
  gradient: {
    height: 24,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  matches: { fontSize: 12 },
  searchResultContainer: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingLeft: 8,
    paddingRight: 16,
    paddingVertical: 12,
  },
  searchResultUserDetails: {
    flex: 1,
    paddingLeft: 8,
  },
  searchResultUserLastOnline: { fontSize: 12 },
  searchResultUserName: { fontSize: 14, fontWeight: '700' },
  sectionHeader: {
    fontSize: 14.5,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});

type UserSearchResultsProps = {
  groupedAlphabetically?: boolean;
  removeOnPressOnly?: boolean;
  results?: unknown[];
  showOnlineStatus?: boolean;
  toggleSelectedUser?: (user: unknown) => void;
};

export const UserSearchResults: React.FC<UserSearchResultsProps> = ({
  groupedAlphabetically = true,
  removeOnPressOnly = false,
  results: resultsProp,
  showOnlineStatus = true,
  toggleSelectedUser,
}) => {
  const {
    loading,
    loadMore,
    results: resultsContext,
    searchText,
    selectedUserIds,
    toggleUser,
  } = useUserSearchContext();
  const [sections, setSections] = useState<
    Array<{
      data: unknown[];
      title: string;
    }>
  >([]);

  const results = resultsProp || resultsContext;
  const resultsLength = results.length;
  useEffect(() => {
    const newSections: {
      [key: string]: {
        data: unknown[];
        title: string;
      };
    } = {};

    results.forEach((user) => {
      const initial = user.name?.slice(0, 1).toUpperCase();

      if (!initial) {
        return;
      }

      if (!newSections[initial]) {
        newSections[initial] = {
          data: [user],
          title: initial,
        };
      } else {
        newSections[initial].data.push(user);
      }
    });
    setSections(Object.values(newSections));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsLength]);

  return (
    <View style={[styles.flex]}>
      {groupedAlphabetically && sections.length > 0 && (
        <View style={styles.gradient}>
          <Text
            style={[
              styles.matches,
            ]}
          >
            {searchText ? `Matches for "${searchText}"` : 'On the platform'}
          </Text>
        </View>
      )}
      {loading && (!results || results.length === 0) && searchText === '' ? (
        <ActivityIndicator size='small' />
      ) : (
        <SectionList
          keyboardDismissMode='interactive'
          keyboardShouldPersistTaps='handled'
          // eslint-disable-next-line react/no-unstable-nested-components
          ListEmptyComponent={() => (
            <View style={styles.emptyResultIndicator} />
          )}
          onEndReached={loadMore}
          renderItem={({ item }) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => {
                if (toggleSelectedUser) {
                  toggleSelectedUser(item);
                } else {
                  toggleUser(item);
                }
              }}
              style={[
                styles.searchResultContainer,
              ]}
            >
              <View style={styles.searchResultUserDetails}>
                <Text
                  style={[
                    styles.searchResultUserName,
                  ]}
                >
                  {item.name}
                </Text>
                {showOnlineStatus && (
                  <Text
                    style={[
                      styles.searchResultUserLastOnline,
                    ]}
                  >
                    Last online {dayjs(item.last_active).calendar()}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          renderSectionHeader={({ section: { title } }) => {
            if (searchText || !groupedAlphabetically) {
              return null;
            }

            return (
              <Text
                key={title}
                style={[
                  styles.sectionHeader,
                ]}
              >
                {title}
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
