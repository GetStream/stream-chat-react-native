import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { LocalUserType } from '../../types';
import { UserResponse } from 'stream-chat';
import { Text } from 'react-native';
import { EmptySearchState } from '../../icons/EmptySearchState';
import { UserGridItem } from './UserGridItem';

type UserSearchResultsGridProps = {
  onPress: (user: UserResponse<LocalUserType>) => void;
  results: UserResponse<LocalUserType>[];
  gridSize?: number;
  loading?: boolean;
  loadMore?: () => void;
  searchText?: string;
  showOnlineStatus?: boolean;
};

export const UserSearchResultsGrid: React.FC<UserSearchResultsGridProps> = ({
  gridSize = 4,
  loading = false,
  loadMore = () => null,
  onPress,
  results,
  searchText,
}) => {
  const [rows, setRows] = useState<Array<UserResponse<LocalUserType>[]>>([[]]);

  useEffect(() => {
    const newRows: Array<UserResponse<LocalUserType>[]> = [[]];

    for (let i = 0; i < results.length; i = i + gridSize) {
      newRows.push([]);

      const slice = results.slice(i, i + gridSize);
      newRows[newRows.length - 1].push(...slice);
    }
    // @ts-ignore
    setRows(newRows);
  }, [results]);

  const renderRow = (userRow: UserResponse<LocalUserType>[]) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {userRow.map((u) => (
        <UserGridItem
          key={u.id}
          onPress={() => {
            onPress(u);
          }}
          removeButton={false}
          user={u}
        />
      ))}
    </View>
  );
  return (
    <View style={{ flexGrow: 1, flexShrink: 1 }}>
      {loading && results.length === 0 && searchText === '' ? (
        <ActivityIndicator size='small' />
      ) : (
        <FlatList<Array<UserResponse<LocalUserType>>>
          data={rows}
          keyboardDismissMode='interactive'
          keyboardShouldPersistTaps='handled'
          ListEmptyComponent={() => (
            <View style={styles.emptyResultIndicator}>
              <EmptySearchState height={124} width={124} />
              <Text>No user matches these keywords</Text>
              <Text>{loading ? 'true' : 'false'}</Text>
              <Text>{results.length}</Text>
            </View>
          )}
          onEndReached={() => {
            loadMore();
          }}
          renderItem={({ item: users }) => renderRow(users)}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyResultIndicator: {
    alignItems: 'center',
    height: 300,
    justifyContent: 'center',
  },
  emptyResultIndicatorEmoji: {
    fontSize: 60,
  },
  inputBox: {
    flex: 1,
    marginRight: 2,
  },
  inputBoxContainer: {
    flexDirection: 'row',
    margin: 4,
    width: '100%',
  },
  searchContainer: {
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  searchContainerLabel: {
    fontSize: 15,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 4,
  },
  searchResultContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 8,
    paddingBottom: 13,
    paddingTop: 13,
  },
  searchResultUserDetails: {
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 8,
  },
  searchResultUserLastOnline: { fontSize: 12.5 },
  searchResultUserName: { fontSize: 14 },
});
