import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, type FlatListProps, StyleSheet, Text, View } from 'react-native';

import type { ScheduledMessageResponse, ScheduledMessagesView } from 'stream-chat';
import { nsToDate, SCHEDULED_MESSAGE_STATUS, toScheduledMessagePreview } from 'stream-chat';

import {
  getScheduledMessageChannel,
  useScheduledMessageActionHandlers,
} from './hooks/useScheduledMessageActionHandlers';

import type {
  GetScheduledMessageActionItems,
  ScheduledMessageActions,
} from './hooks/useScheduledMessageActionItems';
import { useScheduledMessageList } from './hooks/useScheduledMessageList';

import { ScheduledMessageListLoadingSkeleton } from './ScheduledMessageListLoadingSkeleton';

import { formatScheduledDateTime } from './utils/scheduledTimeLabels';

import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../hooks/useStableCallback';
import { components, primitives } from '../../theme';
import { useChannelPreviewDisplayName } from '../ChannelPreview/hooks/useChannelPreviewDisplayName';
import { NotificationList } from '../Notifications/NotificationList';
import { NotificationTargetProvider } from '../Notifications/NotificationTargetContext';
import { Button } from '../ui';
import { EmptyList } from '../UIComponents/EmptyList';
import { EmptySearchResult } from '../UIComponents/EmptySearchResult';
import { SearchInput, SearchInputProps } from '../UIComponents/SearchInput';

export type ScheduledMessageListProps = {
  /**
   * What to list: `channel.scheduledMessages`, `thread.scheduledMessages`, or a view of a list
   * across channels, e.g. `new ScheduledMessagesView({ paginator })`. It loads the first page
   * if needed, and the next ones on scroll.
   */
  view: ScheduledMessagesView;
  /** Additional props passed to the underlying `FlatList`. */
  additionalFlatListProps?: Partial<FlatListProps<ScheduledMessageResponse>>;
  /** Customizes the actions offered for a scheduled message. */
  getScheduledMessageActionItems?: GetScheduledMessageActionItems;
  /** Called when `Edit message` is tapped. Without it, `Edit message` isn't offered. */
  onEditScheduledMessage?: (scheduledMessage: ScheduledMessageResponse) => void;
  /** Replaces the default text search, e.g. to also match the channel name. */
  searchFilter?: ScheduledMessageSearchFilter;
  searchInputProps?: SearchInputProps;
};

const keyExtractor = (scheduledMessage: ScheduledMessageResponse) => scheduledMessage.id;

/** Whether a scheduled message matches the search; `searchQuery` is the search field's text. */
export type ScheduledMessageSearchFilter = (
  scheduledMessage: ScheduledMessageResponse,
  searchQuery: string,
) => boolean;

/** The default search: the message text contains the query, ignoring case. */
export const matchesScheduledMessageText: ScheduledMessageSearchFilter = (
  { message },
  searchQuery,
) => !!message.text?.toLocaleLowerCase().includes(searchQuery.trim().toLocaleLowerCase());

const ScheduledMessageListLoadError = ({ onRetry }: { onRetry: () => void }) => {
  const { icons } = useComponentsContext();
  const { t } = useTranslationContext();
  const {
    theme: { semantics },
  } = useTheme();

  return (
    <View style={styles.centered} testID='scheduled-message-list-error'>
      <icons.ExclamationCircleOutline
        height={components.iconSizeLg}
        stroke={semantics.textTertiary}
        width={components.iconSizeLg}
      />
      <View style={styles.errorBody}>
        <Text style={[styles.errorText, { color: semantics.textSecondary }]}>
          {t('scheduledMessages.loadFailed.error', "Couldn't load scheduled messages")}
        </Text>
        <Button
          label={t('scheduledMessages.tryAgain.label', 'Try again')}
          onPress={onRetry}
          size='md'
          testID='scheduled-message-list-retry'
          type='outline'
          variant='secondary'
        />
      </View>
    </View>
  );
};

const ScheduledMessageListContent = ({
  additionalFlatListProps,
  getScheduledMessageActionItems,
  onEditScheduledMessage,
  searchFilter = matchesScheduledMessageText,
  searchInputProps,
  view,
}: ScheduledMessageListProps) => {
  const { error, hasMoreTail, isLoading, items, loadMore, reload } = useScheduledMessageList(view);
  const { client } = useChatContext();
  const { t, tDateTimeParser } = useTranslationContext();
  const {
    theme: {
      scheduledMessages: { list: listTheme },
      semantics,
    },
  } = useTheme();
  const { icons, ScheduledMessageActionsSheet, ScheduledMessageListItem, ScheduleTimeSheet } =
    useComponentsContext();
  const {
    copyScheduledMessageText,
    deleteScheduledMessage,
    notifyStillSending,
    refuseDeletedQuote,
    rescheduleScheduledMessage,
    sendScheduledMessageNow,
  } = useScheduledMessageActionHandlers();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionTarget, setActionTarget] = useState<ScheduledMessageResponse>();
  const [rescheduleTarget, setRescheduleTarget] = useState<ScheduledMessageResponse>();
  const actionTargetDisplayName = useChannelPreviewDisplayName(
    actionTarget ? getScheduledMessageChannel(client, actionTarget) : undefined,
  )?.trim();

  const visibleItems = useMemo(
    () =>
      items && searchQuery.trim() ? items.filter((item) => searchFilter(item, searchQuery)) : items,
    [items, searchFilter, searchQuery],
  );

  // With nothing shown there is nothing to scroll, so the next page loads by itself: what the view
  // or the search accepts may be on a page that isn't loaded yet.
  const loadsFurther = !!visibleItems && !visibleItems.length && hasMoreTail && !error;
  useEffect(() => {
    if (loadsFurther && !isLoading) loadMore();
  }, [isLoading, loadMore, loadsFurther]);

  const confirmDelete = useCallback(
    (scheduledMessage: ScheduledMessageResponse) => {
      const name = scheduledMessage.channel?.name || actionTargetDisplayName;
      Alert.alert(
        t('scheduledMessages.deleteConfirm.title', 'Delete scheduled message?'),
        name
          ? t(
              'scheduledMessages.deleteConfirm.withName.text',
              "This message to {{ name }} won't be sent. This can't be undone.",
              { name },
            )
          : t(
              'scheduledMessages.deleteConfirm.text',
              "This message won't be sent. This can't be undone.",
            ),
        [
          { style: 'cancel', text: t('common.cancel.label', 'Cancel') },
          {
            onPress: () => {
              deleteScheduledMessage(scheduledMessage);
            },
            style: 'destructive',
            text: t('scheduledMessages.delete.label', 'Delete'),
          },
        ],
      );
    },
    [actionTargetDisplayName, deleteScheduledMessage, t],
  );

  const actionTargetActions = useMemo<ScheduledMessageActions | undefined>(() => {
    if (!actionTarget) return undefined;
    return {
      copyMessageText: () => copyScheduledMessageText(actionTarget),
      delete: () => confirmDelete(actionTarget),
      edit: onEditScheduledMessage ? () => onEditScheduledMessage(actionTarget) : undefined,
      reschedule: () => {
        if (!refuseDeletedQuote(actionTarget)) setRescheduleTarget(actionTarget);
      },
      sendNow: () => {
        sendScheduledMessageNow(actionTarget);
      },
    };
  }, [
    actionTarget,
    confirmDelete,
    copyScheduledMessageText,
    onEditScheduledMessage,
    refuseDeletedQuote,
    sendScheduledMessageNow,
  ]);

  const onPressItem = useCallback(
    (scheduledMessage: ScheduledMessageResponse) => {
      if (scheduledMessage.status === SCHEDULED_MESSAGE_STATUS.Sending) {
        notifyStillSending();
        return;
      }
      setActionTarget(scheduledMessage);
    },
    [notifyStillSending],
  );

  const renderItem = useCallback(
    ({ item }: { item: ScheduledMessageResponse }) => (
      <ScheduledMessageListItem onPress={onPressItem} scheduledMessage={item} />
    ),
    [onPressItem, ScheduledMessageListItem],
  );

  const hasItems = !!items?.length;
  const emptyState =
    !items && error ? (
      <ScheduledMessageListLoadError onRetry={reload} />
    ) : !items || (isLoading && !hasItems) ? (
      <ScheduledMessageListLoadingSkeleton />
    ) : !hasItems ? (
      <EmptyList
        icon={icons.Time}
        subtitle={t(
          'scheduledMessages.empty.description',
          'Long press the send button in a channel to schedule a message.',
        )}
        title={t('scheduledMessages.empty.title', 'No scheduled messages')}
      />
    ) : (
      <EmptySearchResult label={t('scheduledMessages.empty.title', 'No scheduled messages')} />
    );

  const rescheduleChannel = rescheduleTarget
    ? getScheduledMessageChannel(client, rescheduleTarget)
    : undefined;

  const closeActions = useStableCallback(() => setActionTarget(undefined));
  const closeReschedule = useStableCallback(() => setRescheduleTarget(undefined));

  const confirmReschedule = useStableCallback(async (scheduledAt: Date) => {
    if (!rescheduleTarget) return {};
    return { errorText: await rescheduleScheduledMessage(rescheduleTarget, scheduledAt) };
  });

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: semantics.backgroundCoreApp },
        listTheme.container,
      ]}
    >
      {/* Shown while the first page loads too, so the screen doesn't shift once it arrives. */}
      {hasItems || searchQuery || (!items && !error) ? (
        <SearchInput
          accessibilityLabel={t(
            'scheduledMessages.search.accessibilityLabel',
            'Search scheduled messages',
          )}
          onChangeText={setSearchQuery}
          value={searchQuery}
          {...searchInputProps}
        />
      ) : null}
      <View style={styles.container}>
        <FlatList
          contentContainerStyle={[styles.listContent, listTheme.listContent]}
          data={visibleItems}
          keyboardDismissMode='interactive'
          keyboardShouldPersistTaps='handled'
          keyExtractor={keyExtractor}
          ListEmptyComponent={emptyState}
          onEndReached={loadMore}
          onEndReachedThreshold={0.2}
          renderItem={renderItem}
          style={[styles.list, listTheme.list]}
          testID='scheduled-message-list'
          {...additionalFlatListProps}
        />
        <NotificationList />
      </View>
      <ScheduledMessageActionsSheet
        actions={actionTargetActions}
        getScheduledMessageActionItems={getScheduledMessageActionItems}
        onClose={closeActions}
        scheduledMessage={actionTarget}
      />
      {rescheduleTarget && rescheduleChannel ? (
        <ScheduleTimeSheet
          channel={rescheduleChannel}
          initialDate={nsToDate(rescheduleTarget.scheduled_at)}
          message={toScheduledMessagePreview(rescheduleTarget)}
          // A failed message comes back as a new one, so it's scheduled like any other.
          mode={
            rescheduleTarget.status === SCHEDULED_MESSAGE_STATUS.Failed ? 'schedule' : 'reschedule'
          }
          onClose={closeReschedule}
          onConfirm={confirmReschedule}
          previewTitle={t('scheduledMessages.banner.single.text', 'Scheduled for {{ time }}', {
            time: formatScheduledDateTime(nsToDate(rescheduleTarget.scheduled_at), {
              t,
              tDateTimeParser,
            }),
          })}
          title={t('scheduledMessages.rescheduleMessage.title', 'Reschedule message')}
          visible
        />
      ) : null}
    </View>
  );
};

/**
 * A list of scheduled messages with search and actions: Reschedule, Send now, Delete and Copy, and
 * Edit through `onEditScheduledMessage`. It works for any view and needs no `Channel`, so it also
 * lists messages across channels. `ChannelScheduledMessages` renders it for a channel or thread,
 * with editing in place.
 */
export const ScheduledMessageList = (props: ScheduledMessageListProps) => {
  const { paginator, parentId } = props.view;
  const hostId = `scheduled-message-list:${paginator.id}${parentId ? `:${parentId}` : ''}`;

  return (
    <NotificationTargetProvider hostId={hostId} panel='channel-details'>
      <ScheduledMessageListContent {...props} />
    </NotificationTargetProvider>
  );
};

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: primitives.spacingSm,
    justifyContent: 'center',
    paddingHorizontal: primitives.spacingMd,
    paddingVertical: primitives.spacing3xl,
  },
  container: {
    flex: 1,
  },
  errorBody: {
    alignItems: 'center',
    gap: primitives.spacingMd,
  },
  errorText: {
    fontSize: primitives.typographyFontSizeMd,
    lineHeight: primitives.typographyLineHeightNormal,
    maxWidth: 200,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: primitives.spacing3xl,
  },
});
