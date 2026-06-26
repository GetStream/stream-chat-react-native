import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, type FlatListProps, StyleSheet, View } from 'react-native';

import type { MessageResponse, MessageSearchSource, SearchSourceState } from 'stream-chat';

import { PinnedMessageListLoadingSkeleton } from './PinnedMessageListLoadingSkeleton';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import {
  ChannelPinnedMessageListProvider,
  useChannelPinnedMessageListContext,
} from '../../../../contexts/channelPinnedMessageListContext/ChannelPinnedMessageListContext';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { getNotificationErrorOptions } from '../../../../hooks/actions/useChannelActions';
import { useStateStore } from '../../../../hooks/useStateStore';
import { Pin } from '../../../../icons/pin';
import { primitives } from '../../../../theme';
import { useNotificationApi } from '../../../Notifications/hooks/useNotificationApi';
import { NotificationList } from '../../../Notifications/NotificationList';
import { NotificationTargetProvider } from '../../../Notifications/NotificationTargetContext';
import { EmptyList } from '../../../UIComponents/EmptyList';
import { EmptySearchResult } from '../../../UIComponents/EmptySearchResult';
import { SearchInput, SearchInputProps } from '../../../UIComponents/SearchInput';

export type PinnedMessageListProps = {
  /**
   * Besides the existing default behavior of the pinned message list, you can attach
   * additional props to the underlying React Native FlatList.
   *
   * See https://reactnative.dev/docs/flatlist#props for the full list.
   */
  additionalFlatListProps?: Partial<FlatListProps<MessageResponse>>;
  searchInputProps?: SearchInputProps;
  /**
   * A custom `MessageSearchSource` used to query and paginate the pinned
   * messages. Overrides the source the provider creates by default
   * (pre-configured to fetch pinned messages and search by `text`).
   */
  searchSource?: MessageSearchSource;
};

const keyExtractor = (message: MessageResponse) => message.id;

const listStateSelector = (state: SearchSourceState<MessageResponse>) => ({
  error: state.lastQueryError,
  hasNext: state.hasNext,
  loading: state.isLoading,
  messages: state.items,
  searchQuery: state.searchQuery,
});

const PinnedMessageListContent = ({
  additionalFlatListProps,
  searchInputProps,
}: PinnedMessageListProps) => {
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetails: { pinnedMessageList },
    },
  } = useTheme();
  const styles = useStyles();
  const { PinnedMessageItem } = useComponentsContext();

  const { addNotification } = useNotificationApi();

  const { channel } = useChannelDetailsContext();
  const { searchSource } = useChannelPinnedMessageListContext();
  const { error, hasNext, loading, messages, searchQuery } = useStateStore(
    searchSource.state,
    listStateSelector,
  );

  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      searchSource.search();
    }
  }, [searchSource]);

  const [isEmpty, setIsEmpty] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    if (!messages || isEmpty !== undefined) return;
    if (!searchSource.state.getLatestValue().searchQuery && messages.length === 0) {
      setIsEmpty(true);
    }
  }, [isEmpty, messages, searchSource]);

  useEffect(() => {
    if (!error) {
      return;
    }
    addNotification({
      message: t('Failed to load pinned messages'),
      options: {
        ...getNotificationErrorOptions(error),
        severity: 'error',
        type: 'api:channel:query-pinned-messages:failed',
      },
      origin: { context: { channel }, emitter: 'ChannelPinnedMessageList' },
    });
  }, [error, addNotification, channel, t]);

  const renderItem = useCallback(
    ({ item }: { item: MessageResponse }) => <PinnedMessageItem channel={channel} message={item} />,
    [channel, PinnedMessageItem],
  );

  const loadMore = useCallback(() => {
    // hasNext is true by default, !!messages prevents calling search on initial load
    if (hasNext && !!messages) {
      searchSource.search();
    }
  }, [hasNext, messages, searchSource]);

  const emptyState = loading ? (
    <PinnedMessageListLoadingSkeleton />
  ) : isEmpty ? (
    <EmptyList
      icon={Pin}
      subtitle={t('Long-press a message to pin it to the chat')}
      title={t('No pinned messages')}
    />
  ) : (
    <EmptySearchResult label={t('No pinned messages')} />
  );

  const loadingMoreIndicator = (
    <>{loading && messages && messages.length > 0 && <ActivityIndicator />}</>
  );

  return (
    <View style={[styles.container, pinnedMessageList.container]}>
      {!isEmpty && (
        <SearchInput
          value={searchQuery}
          accessibilityLabel={t('a11y/Search pinned messages')}
          onChangeText={(text) => {
            searchSource.state.partialNext({ searchQuery: text });
            searchSource.search(text);
          }}
          {...searchInputProps}
        />
      )}
      <FlatList
        contentContainerStyle={[styles.listContent, pinnedMessageList.listContent]}
        data={messages}
        keyboardDismissMode='interactive'
        keyboardShouldPersistTaps='handled'
        keyExtractor={keyExtractor}
        ListEmptyComponent={emptyState}
        ListFooterComponent={loadingMoreIndicator}
        onEndReached={loadMore}
        onEndReachedThreshold={0.2}
        renderItem={renderItem}
        style={[styles.list, pinnedMessageList.list]}
        testID='pinned-message-list'
        {...additionalFlatListProps}
      />
      <NotificationList />
    </View>
  );
};

export const PinnedMessageList = ({ searchSource, ...props }: PinnedMessageListProps) => {
  const { channel } = useChannelDetailsContext();
  const notificationHostId = channel?.cid ? `pinned-message-list:${channel.cid}` : undefined;

  if (!notificationHostId) {
    return null;
  }

  return (
    <ChannelPinnedMessageListProvider channel={channel} searchSource={searchSource}>
      <NotificationTargetProvider hostId={notificationHostId} panel='channel-details'>
        <PinnedMessageListContent {...props} />
      </NotificationTargetProvider>
    </ChannelPinnedMessageListProvider>
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
          paddingBottom: primitives.spacing3xl,
        },
      }),
    [],
  );
};
