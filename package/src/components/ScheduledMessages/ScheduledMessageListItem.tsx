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
import { components, primitives } from '../../theme';
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
      style={[
        styles.container,
        { borderBottomColor: semantics.borderCoreSubtle },
        listItem.container,
      ]}
      testID={`scheduled-message-item-${scheduledMessage.id}`}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.contentContainer,
            pressed ? { backgroundColor: semantics.backgroundUtilityPressed } : null,
            listItem.contentContainer,
          ]}
        >
          <Text
            style={[
              styles.time,
              // A message that can't be sent as it is shows its time as disabled.
              { color: failureText ? semantics.textDisabled : semantics.textTertiary },
              listItem.time,
            ]}
          >
            {sendTime}
          </Text>
          <View style={[styles.row, listItem.row]}>
            <ChannelAvatar channel={channel} showOnlineIndicator={false} size='xl' />
            <View style={[styles.content, listItem.content]}>
              <View style={[styles.messageGroup, listItem.messageGroup]}>
                {channelName ? (
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.channelName,
                      { color: semantics.textTertiary },
                      listItem.channelName,
                    ]}
                  >
                    {channelName}
                  </Text>
                ) : null}
                <View style={styles.previewRow}>
                  {PreviewIcon && !!message.attachments?.length ? (
                    <PreviewIcon
                      height={components.iconSizeMd}
                      stroke={semantics.textPrimary}
                      width={components.iconSizeMd}
                    />
                  ) : null}
                  <Text
                    numberOfLines={1}
                    style={[styles.preview, { color: semantics.textPrimary }, listItem.preview]}
                  >
                    {prefix ? `${prefix} ${previewText?.trim() ?? ''}` : previewText?.trim()}
                  </Text>
                </View>
              </View>
              {failureText ? (
                <View style={[styles.status, listItem.status]}>
                  <View style={[styles.statusIcon, listItem.statusIcon]}>
                    <icons.Warning
                      height={components.iconSizeSm}
                      pathFill={semantics.accentError}
                      width={components.iconSizeSm}
                    />
                  </View>
                  <Text
                    style={[
                      styles.statusText,
                      { color: semantics.accentError },
                      listItem.statusText,
                    ]}
                  >
                    {failureText}
                  </Text>
                </View>
              ) : isSending ? (
                <View style={[styles.status, listItem.status]}>
                  <View style={[styles.statusIcon, listItem.statusIcon]}>
                    <Spinner height={components.iconSizeSm} width={components.iconSizeSm} />
                  </View>
                  <Text
                    style={[
                      styles.statusText,
                      { color: semantics.textTertiary },
                      listItem.statusText,
                    ]}
                  >
                    {t('scheduledMessages.sending.label', 'Sending…')}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      )}
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
    borderBottomWidth: 1,
    minHeight: 48,
    paddingHorizontal: primitives.spacingXxs,
  },
  content: {
    flex: 1,
    gap: primitives.spacingXs,
  },
  contentContainer: {
    borderRadius: primitives.radiusMd,
    gap: primitives.spacingXs,
    minHeight: 48,
    padding: primitives.spacingMd,
  },
  messageGroup: {
    gap: primitives.spacingXxs,
    paddingVertical: primitives.spacingXxxs,
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
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: primitives.spacingSm,
  },
  status: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: primitives.spacingXxs,
  },
  // Keeps the icon level with the first line when the reason wraps.
  statusIcon: {
    paddingVertical: primitives.spacingXxxs,
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
