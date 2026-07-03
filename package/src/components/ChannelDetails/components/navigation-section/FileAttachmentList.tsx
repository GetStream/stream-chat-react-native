import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  type SectionListProps,
  StyleSheet,
  View,
} from 'react-native';

import type { MessageResponse, MessageSearchSource, SearchSourceState } from 'stream-chat';

import { FileAttachmentListLoadingSkeleton } from './FileAttachmentListLoadingSkeleton';
import { FileAttachmentListSectionHeader } from './FileAttachmentListSectionHeader';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import {
  ChannelFileAttachmentListProvider,
  useChannelFileAttachmentListContext,
} from '../../../../contexts/channelFileAttachmentListContext/ChannelFileAttachmentListContext';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { getNotificationErrorOptions } from '../../../../hooks/actions/useChannelActions';
import { useStateStore } from '../../../../hooks/useStateStore';
import { Folder } from '../../../../icons/folder';
import { primitives } from '../../../../theme';
import { useNotificationApi } from '../../../Notifications/hooks/useNotificationApi';
import { NotificationList } from '../../../Notifications/NotificationList';
import { NotificationTargetProvider } from '../../../Notifications/NotificationTargetContext';
import { EmptyList } from '../../../UIComponents/EmptyList';
import {
  type FileAttachmentSection,
  type FileAttachmentTile,
  useFileAttachmentListSections,
} from '../../hooks/useFileAttachmentListSections';

export type FileAttachmentListProps = {
  /**
   * Besides the existing default behavior of the file attachment list, you can attach
   * additional props to the underlying React Native SectionList.
   *
   * See https://reactnative.dev/docs/sectionlist#props for the full list.
   */
  additionalSectionListProps?: Partial<SectionListProps<FileAttachmentTile, FileAttachmentSection>>;
  /**
   * A custom `MessageSearchSource` used to query and paginate the file/audio
   * attachments. Overrides the source the provider creates by default
   * (pre-configured to fetch file/audio attachments, newest first).
   */
  searchSource?: MessageSearchSource;
};

const keyExtractor = (item: FileAttachmentTile, index: number) => `${item.message.id}-${index}`;

const listStateSelector = (state: SearchSourceState<MessageResponse>) => ({
  error: state.lastQueryError,
  hasNext: state.hasNext,
  loading: state.isLoading,
  messages: state.items,
});

const FileAttachmentListContent = ({ additionalSectionListProps }: FileAttachmentListProps) => {
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetails: { fileAttachmentList },
    },
  } = useTheme();
  const styles = useStyles();
  const { FileAttachmentItem } = useComponentsContext();

  const { addNotification } = useNotificationApi();

  const { channel } = useChannelDetailsContext();
  const { searchSource } = useChannelFileAttachmentListContext();
  const { error, hasNext, loading, messages } = useStateStore(
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
    if (!messages || isEmpty !== undefined) {
      return;
    }
    if (messages.length === 0) {
      setIsEmpty(true);
    } else {
      setIsEmpty(false);
    }
  }, [isEmpty, messages]);

  useEffect(() => {
    if (!error) {
      return;
    }
    addNotification({
      message: t('Failed to load files'),
      options: {
        ...getNotificationErrorOptions(error),
        severity: 'error',
        type: 'api:channel:query-file-attachments:failed',
      },
      origin: { context: { channel }, emitter: 'ChannelFileAttachmentList' },
    });
  }, [error, addNotification, channel, t]);

  const sections = useFileAttachmentListSections(messages);

  const renderItem = useCallback(
    ({ item }: { item: FileAttachmentTile }) => (
      <FileAttachmentItem attachment={item.attachment} message={item.message} />
    ),
    [FileAttachmentItem],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: FileAttachmentSection }) => (
      <FileAttachmentListSectionHeader title={section.title} />
    ),
    [],
  );

  const loadMore = useCallback(() => {
    // hasNext is true by default, !!messages prevents calling search on initial load
    if (hasNext && !!messages) {
      searchSource.search();
    }
  }, [hasNext, messages, searchSource]);

  const emptyState =
    loading || isEmpty === undefined ? (
      <FileAttachmentListLoadingSkeleton />
    ) : (
      <EmptyList icon={Folder} subtitle={t('Share a file to see it here')} title={t('No files')} />
    );

  const loadingMoreIndicator = (
    <>{loading && messages && messages.length > 0 && <ActivityIndicator />}</>
  );

  return (
    <View style={[styles.container, fileAttachmentList.container]}>
      <SectionList
        contentContainerStyle={[styles.listContent, fileAttachmentList.listContent]}
        keyboardDismissMode='interactive'
        keyboardShouldPersistTaps='handled'
        keyExtractor={keyExtractor}
        ListEmptyComponent={emptyState}
        ListFooterComponent={loadingMoreIndicator}
        onEndReached={loadMore}
        onEndReachedThreshold={0.2}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        sections={sections}
        stickySectionHeadersEnabled
        style={[styles.list, fileAttachmentList.list]}
        testID='file-attachment-list'
        {...additionalSectionListProps}
      />
      <NotificationList />
    </View>
  );
};

export const FileAttachmentList = ({ searchSource, ...props }: FileAttachmentListProps) => {
  const { channel } = useChannelDetailsContext();
  const notificationHostId = channel?.cid ? `file-attachment-list:${channel.cid}` : undefined;

  if (!notificationHostId) {
    return null;
  }

  return (
    <ChannelFileAttachmentListProvider channel={channel} searchSource={searchSource}>
      <NotificationTargetProvider hostId={notificationHostId} panel='channel-details'>
        <FileAttachmentListContent {...props} />
      </NotificationTargetProvider>
    </ChannelFileAttachmentListProvider>
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
