import React, { useMemo } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ScheduledMessageResponse } from 'stream-chat';
import { nsToDate, SCHEDULED_MESSAGE_STATUS, toScheduledMessagePreview } from 'stream-chat';

import { getScheduledMessageChannel } from './hooks/useScheduledMessageActionHandlers';

import { useScheduledTimeFormatter } from './hooks/useScheduledTimeFormatter';

import { getScheduledMessageFailureText } from './utils/failureReason';
import { hasDeletedQuote } from './utils/quote';

import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useMessagePreviewIcon, useMessagePreviewText } from '../../hooks';
import { primitives } from '../../theme';
import { useChannelPreviewDisplayName } from '../ChannelPreview/hooks/useChannelPreviewDisplayName';
import { ChannelAvatar } from '../ui/Avatar/ChannelAvatar';
import { Spinner } from '../UIComponents/Spinner';

export type ScheduledMessageListItemProps = {
  onPress: (scheduledMessage: ScheduledMessageResponse) => void;
  scheduledMessage: ScheduledMessageResponse;
};

export const ScheduledMessageListItem = ({
  onPress,
  scheduledMessage,
}: ScheduledMessageListItemProps) => {
  const { client } = useChatContext();
  const { icons } = useComponentsContext();
  const { t } = useTranslationContext();
  const { formatDateTime } = useScheduledTimeFormatter();
  const {
    theme: {
      scheduledMessages: { listItem },
      semantics,
    },
  } = useTheme();

  const channel = useMemo(
    () => getScheduledMessageChannel(client, scheduledMessage),
    [client, scheduledMessage],
  );
  const displayName = useChannelPreviewDisplayName(channel)?.trim();
  const channelName = scheduledMessage.channel?.name || displayName;

  const message = useMemo(() => toScheduledMessagePreview(scheduledMessage), [scheduledMessage]);
  const PreviewIcon = useMessagePreviewIcon({ message });
  const previewText = useMessagePreviewText({ message });

  const {
    parent_id: parentId,
    quoted_message: quotedMessage,
    quoted_message_id: quotedMessageId,
  } = scheduledMessage.message;
  const quotedName = quotedMessage?.user?.name;
  const prefix = parentId
    ? t('scheduledMessages.threadReply.prefix', 'Thread reply:')
    : quotedMessageId
      ? quotedName
        ? t('scheduledMessages.replyTo.prefix', 'Reply to {{ name }}:', { name: quotedName })
        : t('scheduledMessages.reply.prefix', 'Reply:')
      : undefined;

  const isFailed = scheduledMessage.status === SCHEDULED_MESSAGE_STATUS.Failed;
  const isSending = scheduledMessage.status === SCHEDULED_MESSAGE_STATUS.Sending;
  const failureText = isFailed
    ? getScheduledMessageFailureText(t, scheduledMessage)
    : hasDeletedQuote(scheduledMessage)
      ? t(
          'scheduledMessages.quoteDeleted.text',
          'The quoted message was deleted. Edit it to remove the quote.',
        )
      : undefined;
  const sendTime = t('scheduledMessages.sendTime.label', 'Send {{ time }}', {
    time: formatDateTime(nsToDate(scheduledMessage.scheduled_at)),
  });

  return (
    <Pressable
      accessibilityRole='button'
      onPress={() => onPress(scheduledMessage)}
      style={({ pressed }) => [
        styles.container,
        { borderBottomColor: semantics.borderCoreSubtle },
        pressed ? { backgroundColor: semantics.backgroundUtilityPressed } : null,
        listItem.container,
      ]}
      testID={`scheduled-message-item-${scheduledMessage.id}`}
    >
      <Text style={[styles.time, { color: semantics.textTertiary }, listItem.time]}>
        {sendTime}
      </Text>
      <View style={[styles.row, listItem.row]}>
        <ChannelAvatar channel={channel} showOnlineIndicator={false} size='xl' />
        <View style={[styles.content, listItem.content]}>
          {channelName ? (
            <Text
              numberOfLines={1}
              style={[styles.channelName, { color: semantics.textSecondary }, listItem.channelName]}
            >
              {channelName}
            </Text>
          ) : null}
          <View style={styles.previewRow}>
            {PreviewIcon && !!message.attachments?.length ? (
              <PreviewIcon height={16} stroke={semantics.textPrimary} width={16} />
            ) : null}
            <Text
              numberOfLines={1}
              style={[styles.preview, { color: semantics.textPrimary }, listItem.preview]}
            >
              {prefix ? `${prefix} ${previewText?.trim() ?? ''}` : previewText?.trim()}
            </Text>
          </View>
          {failureText ? (
            <View style={[styles.status, listItem.status]}>
              <icons.Warning height={14} pathFill={semantics.accentError} width={14} />
              <Text
                style={[styles.statusText, { color: semantics.accentError }, listItem.statusText]}
              >
                {failureText}
              </Text>
            </View>
          ) : isSending ? (
            <View style={[styles.status, listItem.status]}>
              <Spinner height={14} width={14} />
              <Text
                style={[styles.statusText, { color: semantics.textSecondary }, listItem.statusText]}
              >
                {t('scheduledMessages.sending.label', 'Sending…')}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  channelName: {
    fontSize: primitives.typographyFontSizeSm,
    fontWeight: primitives.typographyFontWeightSemiBold,
    lineHeight: primitives.typographyLineHeightNormal,
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: primitives.spacingXxs,
    paddingHorizontal: primitives.spacingMd,
    paddingVertical: primitives.spacingSm,
  },
  content: {
    flex: 1,
  },
  preview: {
    flexShrink: 1,
    fontSize: primitives.typographyFontSizeMd,
    lineHeight: primitives.typographyLineHeightNormal,
  },
  previewRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: primitives.spacingXxs,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: primitives.spacingSm,
  },
  status: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: primitives.spacingXxs,
    paddingTop: primitives.spacingXxs,
  },
  statusText: {
    flexShrink: 1,
    fontSize: primitives.typographyFontSizeSm,
    lineHeight: primitives.typographyLineHeightNormal,
  },
  time: {
    fontSize: primitives.typographyFontSizeSm,
    lineHeight: primitives.typographyLineHeightNormal,
  },
});
