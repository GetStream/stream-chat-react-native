import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AttachmentManagerState,
  DraftMessage,
  LocalMessage,
  TextComposerState,
  Thread,
  ThreadState,
} from 'stream-chat';

import { ThreadListItemMessagePreview as ThreadListItemMessagePreviewDefault } from './ThreadListItemMessagePreview';

import { ThreadMessagePreviewDeliveryStatus as ThreadMessagePreviewDeliveryStatusDefault } from './ThreadMessagePreviewDeliveryStatus';

import { useChatContext, useTheme, useTranslationContext } from '../../contexts';
import {
  ThreadListItemProvider,
  useThreadListItemContext,
} from '../../contexts/threadsContext/ThreadListItemContext';
import { useThreadsContext } from '../../contexts/threadsContext/ThreadsContext';
import { useStateStore } from '../../hooks';
import { primitives } from '../../theme';
import { getDateString } from '../../utils/i18n/getDateString';
import { useChannelPreviewDisplayPresence } from '../ChannelPreview/hooks';
import { useChannelPreviewDisplayName } from '../ChannelPreview/hooks/useChannelPreviewDisplayName';
import { BadgeNotification, UserAvatarStack } from '../ui';
import { UserAvatar } from '../ui/Avatar/UserAvatar';

export type ThreadListItemProps = {
  thread: Thread;
  timestampTranslationKey?: string;
};

export const attachmentTypeIconMap = {
  audio: '🔈',
  file: '📄',
  image: '📷',
  video: '🎥',
  voiceRecording: '🎙️',
} as const;

const textComposerStateSelector = (state: TextComposerState) => ({
  text: state.text,
});

const attachmentManagerStateSelector = (state: AttachmentManagerState) => ({
  attachments: state.attachments,
});

export const ThreadListItemComponent = () => {
  const {
    channel,
    dateString,
    deletedAtDateString,
    draftMessage,
    lastReply,
    ownUnreadMessageCount,
    parentMessage,
    thread,
  } = useThreadListItemContext();
  const online = useChannelPreviewDisplayPresence(channel);
  const displayName = useChannelPreviewDisplayName(channel);
  const {
    onThreadSelect,
    ThreadListItemMessagePreview = ThreadListItemMessagePreviewDefault,
    ThreadMessagePreviewDeliveryStatus = ThreadMessagePreviewDeliveryStatusDefault,
  } = useThreadsContext();
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();
  const { t } = useTranslationContext();

  const shouldRenderPreview = !!draftMessage || !!lastReply;

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={() => {
          if (onThreadSelect) {
            onThreadSelect(
              { thread: parentMessage as LocalMessage, threadInstance: thread },
              channel,
            );
          }
        }}
        style={({ pressed }) => [
          styles.container,
          { backgroundColor: pressed ? semantics.backgroundUtilityPressed : 'transparent' },
        ]}
        testID='thread-list-item'
      >
        {lastReply?.user ? (
          <UserAvatar user={lastReply?.user} size='xl' showOnlineIndicator={online} showBorder />
        ) : null}

        <View style={styles.content}>
          <Text numberOfLines={1} style={styles.channelName}>
            {displayName || 'N/A'}
          </Text>
          {shouldRenderPreview ? (
            <View style={styles.previewMessageContainer}>
              {!draftMessage ? (
                <ThreadMessagePreviewDeliveryStatus
                  channel={channel}
                  message={parentMessage as LocalMessage}
                />
              ) : null}
              <ThreadListItemMessagePreview message={parentMessage as LocalMessage} />
            </View>
          ) : null}
          <View style={styles.lowerRow}>
            <UserAvatarStack
              users={parentMessage?.thread_participants || []}
              avatarSize='sm'
              maxVisible={3}
              overlap={0.4}
            />
            <Text style={styles.messageRepliesText}>
              {parentMessage?.reply_count === 1
                ? t('1 Reply')
                : t('{{ replyCount }} Replies', {
                    replyCount: parentMessage?.reply_count,
                  })}
            </Text>
            <Text style={styles.dateText}>{deletedAtDateString ?? dateString}</Text>
          </View>
        </View>

        {ownUnreadMessageCount > 0 && !deletedAtDateString ? (
          <View style={styles.unreadBubbleWrapper}>
            <BadgeNotification count={ownUnreadMessageCount} size='sm' />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
};

export const ThreadListItem = (props: ThreadListItemProps) => {
  const { client } = useChatContext();
  const { t, tDateTimeParser } = useTranslationContext();
  const { thread, timestampTranslationKey = 'timestamp/ThreadListItem' } = props;
  const { ThreadListItem = ThreadListItemComponent } = useThreadsContext();
  const { text: draftText } = useStateStore(
    thread.messageComposer.textComposer.state,
    textComposerStateSelector,
  );
  const { attachments } = useStateStore(
    thread.messageComposer.attachmentManager.state,
    attachmentManagerStateSelector,
  );

  const selector = useCallback(
    (nextValue: ThreadState) =>
      ({
        channel: nextValue.channel,
        deletedAt: nextValue.deletedAt,
        lastReply: nextValue.replies.at(-1),
        ownUnreadMessageCount:
          (client.userID && nextValue.read[client.userID]?.unreadMessageCount) || 0,
        parentMessage: nextValue.parentMessage,
      }) as const,
    [client],
  );

  const { channel, deletedAt, lastReply, ownUnreadMessageCount, parentMessage } = useStateStore(
    thread.state,
    selector,
  );

  const timestamp = lastReply?.created_at;

  useEffect(() => {
    const unsubscribe = thread.messageComposer.registerDraftEventSubscriptions();
    return () => unsubscribe();
  }, [thread.messageComposer]);

  const draftMessage = useMemo<DraftMessage | undefined>(() => {
    if (thread.messageComposer.compositionIsEmpty) {
      return undefined;
    }

    if (!draftText && !attachments?.length) {
      return undefined;
    }

    return {
      attachments,
      id: thread.messageComposer.id,
      text: draftText ?? '',
    };
  }, [attachments, draftText, thread.messageComposer]);

  // TODO: Please rethink this, we have the same line of code in about 5 places in the SDK.
  const dateString = useMemo(
    () =>
      getDateString({
        date: timestamp,
        t,
        tDateTimeParser,
        timestampTranslationKey,
      }),
    [timestamp, t, tDateTimeParser, timestampTranslationKey],
  );
  const deletedAtDateString = useMemo(
    () =>
      getDateString({
        date: deletedAt as Date | undefined,
        t,
        tDateTimeParser,
        timestampTranslationKey,
      }),
    [deletedAt, t, tDateTimeParser, timestampTranslationKey],
  );

  return (
    <ThreadListItemProvider
      value={{
        channel,
        dateString,
        deletedAtDateString,
        draftMessage,
        lastReply,
        ownUnreadMessageCount,
        parentMessage,
        thread,
      }}
    >
      <ThreadListItem />
    </ThreadListItemProvider>
  );
};

const useStyles = () => {
  const {
    theme: { threadListItem, semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          flex: 1,
          padding: primitives.spacingXxs,
          borderBottomWidth: 1,
          borderBottomColor: semantics.borderCoreSubtle,
          ...threadListItem.wrapper,
        },
        container: {
          flexDirection: 'row',
          gap: primitives.spacingSm,
          padding: primitives.spacingSm,
          borderRadius: primitives.radiusLg,
          ...threadListItem.container,
        },
        channelName: {
          color: semantics.textTertiary,
          fontSize: primitives.typographyFontSizeSm,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
          textAlign: 'left',
          ...threadListItem.channelName,
        },
        content: {
          flex: 1,
          gap: primitives.spacingXs,
          ...threadListItem.content,
        },
        previewMessageContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: primitives.spacingXxs,
          ...threadListItem.previewMessageContainer,
        },
        lowerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: primitives.spacingXs,
          ...threadListItem.lowerRow,
        },
        messageRepliesText: {
          color: semantics.textLink,
          fontSize: primitives.typographyFontSizeSm,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
          ...threadListItem.messageRepliesText,
        },
        dateText: {
          color: semantics.textTertiary,
          fontSize: primitives.typographyFontSizeSm,
          fontWeight: primitives.typographyFontWeightRegular,
          lineHeight: primitives.typographyLineHeightNormal,
          ...threadListItem.dateText,
        },
        unreadBubbleWrapper: {
          ...threadListItem.unreadBubbleWrapper,
        },
      }),
    [semantics, threadListItem],
  );
};
