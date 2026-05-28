import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import type { UserResponse } from 'stream-chat';

import { AddMemberSearchResultItem } from './AddMemberSearchResultItem';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../../hooks/useStableCallback';
import { Search } from '../../../../icons/search';
import { primitives } from '../../../../theme';
import { EmptySearchResult } from '../../../UIComponents/EmptySearchResult';
import { SearchInput } from '../../../UIComponents/SearchInput';
import {
  type AddMemberSearchResult,
  useChannelAddMembers,
} from '../../hooks/members/useChannelAddMembers';

export type ChannelAddMembersProps = {
  /**
   * Fires whenever the internal selection changes. Parent components use this to
   * drive a confirm button (enable when the selection is non-empty, read the
   * selected user ids when committing the add).
   */
  onSelectionChange: (selectedUsers: UserResponse[]) => void;
};

const keyExtractor = (user: AddMemberSearchResult) => user.id;

export const ChannelAddMembers = ({ onSelectionChange }: ChannelAddMembersProps) => {
  const { channel } = useChannelDetailsContext();
  const { t } = useTranslationContext();
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();

  const {
    clearSearch,
    isSelected,
    loading,
    loadMore,
    onChangeSearchText,
    results,
    selectedUsers,
    toggleUser,
  } = useChannelAddMembers({ channel });

  const stableOnSelectionChange = useStableCallback(onSelectionChange);

  const lastSelectionRef = useRef(selectedUsers);
  useEffect(() => {
    if (lastSelectionRef.current === selectedUsers) return;
    lastSelectionRef.current = selectedUsers;
    stableOnSelectionChange(selectedUsers);
  }, [selectedUsers, stableOnSelectionChange]);

  const renderItem = useCallback(
    ({ item }: { item: AddMemberSearchResult }) => (
      <AddMemberSearchResultItem
        isAlreadyMember={item.isAlreadyMember}
        onPress={() => toggleUser(item)}
        selected={isSelected(item.id)}
        user={item}
      />
    ),
    [isSelected, toggleUser],
  );

  const emptyState = (
    <EmptySearchResult
      icon={<Search height={24} stroke={semantics.textTertiary} width={24} />}
      label={t('No user found')}
      loading={loading}
    />
  );

  const loadingMoreIndicator = <>{loading && <ActivityIndicator />}</>;

  return (
    <View style={styles.container}>
      <SearchInput
        accessibilityLabel={t('a11y/Search users to add')}
        onChangeText={onChangeSearchText}
        onClear={clearSearch}
      />

      <FlatList
        contentContainerStyle={styles.listContent}
        data={results}
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
