import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { vw } from 'stream-chat-react-native';

import { UserGridItem } from './UserGridItem';

import { EmptySearchState } from '../../icons/EmptySearchState';

import type { UserResponse } from 'stream-chat';

import type { LocalUserType } from '../../types';

const totalUserSpace = vw(100) - 56; // 36 = outside margin 8 * 2 + inner padding 20 * 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: { flexGrow: 1 },
  emptyResultIndicator: {
    alignItems: 'center',
    height: 300,
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  userGridItemContainer: {
    paddingBottom: 10,
    width: 64,
  },
});

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
}) => (
  <View style={styles.container}>
    {loading && results.length === 0 && searchText === '' ? (
      <ActivityIndicator size='small' />
    ) : (
      <FlatList
        contentContainerStyle={styles.contentContainer}
        data={results}
        keyboardDismissMode='interactive'
        keyboardShouldPersistTaps='handled'
        keyExtractor={(item, index) => `${item.id}-${index}`}
        ListEmptyComponent={() => (
          <View style={styles.emptyResultIndicator}>
            <EmptySearchState height={124} width={124} />
            <Text>No user matches these keywords</Text>
            <Text>{loading ? 'true' : 'false'}</Text>
            <Text>{results.length}</Text>
          </View>
        )}
        numColumns={gridSize}
        onEndReached={loadMore}
        renderItem={({ index, item: user }) => (
          <View
            style={[
              styles.userGridItemContainer,
              {
                marginLeft: index % gridSize !== 0 ? (totalUserSpace - 64 * gridSize) / 3 : 0,
              },
            ]}
          >
            <UserGridItem
              onPress={() => {
                onPress(user);
              }}
              removeButton={false}
              user={user}
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        style={styles.flex}
      />
    )}
  </View>
);
