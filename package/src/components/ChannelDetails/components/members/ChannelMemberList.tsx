import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, type FlatListProps, StyleSheet, View } from 'react-native';

import type {
  ChannelMemberResponse,
  ChannelMemberSearchSource,
  SearchSourceState,
} from 'stream-chat';

import { MemberListLoadingSkeleton } from './MemberListLoadingSkeleton';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import {
  ChannelMemberListProvider,
  useChannelMemberListContext,
} from '../../../../contexts/channelMemberListContext/ChannelMemberListContext';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { getNotificationErrorOptions } from '../../../../hooks/actions/useChannelActions';
import { useChannelMemberCount } from '../../../../hooks/useChannelMemberCount';
import { useStateStore } from '../../../../hooks/useStateStore';
import { primitives } from '../../../../theme';
import { useNotificationApi } from '../../../Notifications/hooks/useNotificationApi';
import { NotificationList } from '../../../Notifications/NotificationList';
import { NotificationTargetProvider } from '../../../Notifications/NotificationTargetContext';
import { EmptySearchResult } from '../../../UIComponents/EmptySearchResult';
import { SearchInput, SearchInputProps } from '../../../UIComponents/SearchInput';

const keyExtractor = (member: ChannelMemberResponse) => member.user?.id ?? member.user_id ?? '';

const listStateSelector = (state: SearchSourceState<ChannelMemberResponse>) => ({
  error: state.lastQueryError,
  hasNext: state.hasNext,
  loading: state.isLoading,
  members: state.items,
  searchQuery: state.searchQuery,
});

export type ChannelMemberListProps = {
  /**
   * Besides the existing default behavior of the members list, you can attach
   * additional props to the underlying React Native FlatList.
   *
   * See https://reactnative.dev/docs/flatlist#props for the full list.
   */
  additionalFlatListProps?: Partial<FlatListProps<ChannelMemberResponse>>;
  searchInputProps?: SearchInputProps;
  /**
   * A custom `ChannelMemberSearchSource` used to query and paginate the member
   * list. Overrides the source the provider creates by default (pre-configured
   * to autocomplete by `name`).
   */
  searchSource?: ChannelMemberSearchSource;
};

const ChannelMemberListContent = ({
  additionalFlatListProps,
  searchInputProps,
}: ChannelMemberListProps) => {
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetails: { memberList },
    },
  } = useTheme();
  const { ChannelMemberActionsSheet, ChannelMemberItem } = useComponentsContext();
  const { addNotification } = useNotificationApi();

  const { channel } = useChannelDetailsContext();
  const { searchSource } = useChannelMemberListContext();
  const { error, hasNext, loading, members, searchQuery } = useStateStore(
    searchSource.state,
    listStateSelector,
  );

  const [selectedMember, setSelectedMember] = useState<ChannelMemberResponse | null>(null);

  const memberCount = useChannelMemberCount(channel);

  // Fetch members on mount and when the member count changes
  // Member count changes used when add member modal is opened above member list modal
  useEffect(() => {
    if (!searchSource.state.getLatestValue().searchQuery) {
      searchSource.resetStateAndActivate();
      searchSource.search();
    }
  }, [memberCount, searchSource]);

  useEffect(() => {
    if (!error) {
      return;
    }
    addNotification({
      message: t('Failed to load members'),
      options: {
        ...getNotificationErrorOptions(error),
        severity: 'error',
        type: 'api:channel:query-members:failed',
      },
      origin: { context: { channel }, emitter: 'ChannelMemberList' },
    });
  }, [error, addNotification, channel, t]);

  const handleMemberActionsClose = useCallback(() => setSelectedMember(null), []);

  const handleMemberPress = useCallback(
    (member: ChannelMemberResponse) => setSelectedMember(member),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChannelMemberResponse }) => (
      <ChannelMemberItem member={item} onPress={handleMemberPress} />
    ),
    [ChannelMemberItem, handleMemberPress],
  );

  const loadMore = useCallback(() => {
    // hasNext is true by default, !!members prevents calling search on initial load
    if (hasNext && !!members) {
      searchSource.search();
    }
  }, [hasNext, members, searchSource]);

  const emptyState =
    loading && !members ? (
      <MemberListLoadingSkeleton />
    ) : (
      <EmptySearchResult label={t('No members found')} />
    );

  return (
    <View style={[styles.container, memberList.container]}>
      <SearchInput
        accessibilityLabel={t('a11y/Search members')}
        onChangeText={(text) => {
          searchSource.state.partialNext({ searchQuery: text });
          searchSource.search(text);
        }}
        value={searchQuery}
        {...searchInputProps}
      />
      <FlatList
        contentContainerStyle={[styles.listContent, memberList.listContent]}
        data={members}
        keyboardDismissMode='interactive'
        keyboardShouldPersistTaps='handled'
        keyExtractor={keyExtractor}
        ListEmptyComponent={emptyState}
        ListFooterComponent={
          loading && members && members.length > 0 ? <ActivityIndicator /> : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.2}
        renderItem={renderItem}
        style={[styles.list, memberList.list]}
        testID='channel-member-list'
        {...additionalFlatListProps}
      />
      {selectedMember ? (
        <ChannelMemberActionsSheet
          member={selectedMember}
          onClose={handleMemberActionsClose}
          visible
        />
      ) : null}
      <NotificationList />
    </View>
  );
};

/**
 * Lists all channel members with the ability to search them.
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelMemberList = ({ searchSource, ...props }: ChannelMemberListProps = {}) => {
  const { channel } = useChannelDetailsContext();
  const notificationHostId = channel?.cid ? `channel-member-list:${channel.cid}` : undefined;

  if (!notificationHostId) {
    return null;
  }

  return (
    <ChannelMemberListProvider channel={channel} searchSource={searchSource}>
      <NotificationTargetProvider hostId={notificationHostId} panel='channel-details'>
        <ChannelMemberListContent {...props} />
      </NotificationTargetProvider>
    </ChannelMemberListProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: primitives.spacing3xl,
  },
});
