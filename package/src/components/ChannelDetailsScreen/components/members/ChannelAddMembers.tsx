import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, FlatList, type FlatListProps, StyleSheet, View } from 'react-native';

import type { SearchSourceState, UserResponse } from 'stream-chat';

import { AddMemberSearchResultItem } from './AddMemberSearchResultItem';
import { UserListLoadingSkeleton } from './UserListLoadingSkeleton';

import { useChannelAddMembersContext } from '../../../../contexts/channelAddMembersContext/ChannelAddMembersContext';
import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { getNotificationErrorOptions } from '../../../../hooks/actions/useChannelActions';
import { useStateStore } from '../../../../hooks/useStateStore';
import { Search } from '../../../../icons/search';
import { primitives } from '../../../../theme';
import { useNotificationApi } from '../../../Notifications/hooks/useNotificationApi';
import { EmptySearchResult } from '../../../UIComponents/EmptySearchResult';
import { SearchInput } from '../../../UIComponents/SearchInput';

export type ChannelAddMembersProps = {
  /**
   * Besides the existing default behavior of the user list, you can attach
   * additional props to the underlying React Native FlatList.
   *
   * See https://reactnative.dev/docs/flatlist#props for the full list.
   */
  additionalFlatListProps?: Partial<FlatListProps<UserResponse>>;
};

const keyExtractor = (user: UserResponse) => user.id;

const listStateSelector = (state: SearchSourceState<UserResponse>) => {
  return {
    users: state.items,
    loading: state.isLoading,
    hasNext: state.hasNext,
    error: state.lastQueryError,
  };
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelAddMembers = ({ additionalFlatListProps }: ChannelAddMembersProps) => {
  const { t } = useTranslationContext();
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();

  const { channel } = useChannelDetailsContext();
  const { addNotification } = useNotificationApi();

  const { searchSource, selectionStore } = useChannelAddMembersContext();
  const { users, loading, hasNext, error } = useStateStore(searchSource.state, listStateSelector);

  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      searchSource.search('');
    }
  }, [searchSource]);

  useEffect(() => {
    if (!error) {
      return;
    }
    addNotification({
      message: t('Failed to load users'),
      options: {
        ...getNotificationErrorOptions(error),
        severity: 'error',
        type: 'api:channel:query-users:failed',
      },
      origin: { context: { channel }, emitter: 'AddChannelMembers' },
    });
  }, [error, addNotification, channel, t]);

  const select = useCallback(
    (user: UserResponse) => {
      selectionStore.toggle(user.id);
    },
    [selectionStore],
  );

  const renderItem = useCallback(
    ({ item }: { item: UserResponse }) => (
      <AddMemberSearchResultItem onPress={select} user={item} />
    ),
    [select],
  );

  const loadMore = useCallback(() => {
    // hasNext true by default, !!users prevents calling search on initial load
    if (hasNext && !!users) {
      searchSource.search();
    }
  }, [hasNext, searchSource, users]);

  const emptyState = loading ? (
    <UserListLoadingSkeleton />
  ) : (
    <EmptySearchResult
      icon={<Search height={24} stroke={semantics.textTertiary} width={24} />}
      label={t('No user found')}
    />
  );

  const loadingMoreIndicator = <>{loading && users && users.length > 0 && <ActivityIndicator />}</>;

  return (
    <View style={styles.container}>
      <SearchInput
        accessibilityLabel={t('a11y/Search users to add')}
        onChangeText={(text) => searchSource.search(text)}
      />

      <FlatList
        contentContainerStyle={styles.listContent}
        data={users}
        keyboardDismissMode='interactive'
        keyboardShouldPersistTaps='handled'
        keyExtractor={keyExtractor}
        ListEmptyComponent={emptyState}
        ListFooterComponent={loadingMoreIndicator}
        onEndReached={loadMore}
        onEndReachedThreshold={0.2}
        renderItem={renderItem}
        style={styles.list}
        testID='channel-add-members-list'
        {...additionalFlatListProps}
      />
    </View>
  );
};

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        list: {
          flex: 1,
        },
        listContent: {
          flexGrow: 1,
          paddingBottom: primitives.spacingXl,
        },
      }),
    [],
  );
};
