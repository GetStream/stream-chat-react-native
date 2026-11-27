import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import Animated from 'react-native-reanimated';

import type { ChannelLifecycleState } from 'stream-chat';
import { nsToDate, SCHEDULED_MESSAGE_STATUS } from 'stream-chat';

import { useChannelScheduledMessageLimit } from './hooks/useChannelScheduledMessageLimit';
import { useChannelScheduledMessages } from './hooks/useChannelScheduledMessages';
import { useChannelWideScheduledMessagesView } from './hooks/useChannelWideScheduledMessagesView';
import { useEditedScheduledMessage } from './hooks/useEditedScheduledMessage';

import { useScheduledTimeFormatter } from './hooks/useScheduledTimeFormatter';
import { isPendingScheduledMessage } from './utils/actions';

import { useAnnounceOnStateChange } from '../../a11y/hooks/useAnnounceOnStateChange';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useMessageInputContext } from '../../contexts/messageInputContext/MessageInputContext';
import { useMessagesContext } from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useThreadContext } from '../../contexts/threadContext/ThreadContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../hooks/useStateStore';
import { primitives } from '../../theme';
import { transitions } from '../../utils/animations/transitions';

/** The gap between the banner and the composer. */
const COMPOSER_GAP = 16;

// The list keeps this much room above the banner, as it does above a floating composer.
const LIST_GAP = 16;

const pendingDisposalSelector = ({ pendingDisposal }: ChannelLifecycleState) => ({
  pendingDisposal,
});

const ScheduledMessagesBannerContent = () => {
  const { channel } = useChannelContext();
  const { thread } = useThreadContext();
  const { onScheduledMessagesBannerPress } = useMessagesContext();
  const { messageInputHeightStore } = useMessageInputContext();
  const { icons } = useComponentsContext();
  const { t } = useTranslationContext();
  const { formatDateTime } = useScheduledTimeFormatter();
  const {
    theme: {
      scheduledMessages: { banner: bannerTheme },
      semantics,
    },
  } = useTheme();

  const channelWideView = useChannelWideScheduledMessagesView(channel);
  // A thread's banner counts only the thread's scheduled replies.
  const view = thread ? thread.scheduledMessages : channelWideView;
  const { scheduledMessages } = useChannelScheduledMessages(view);
  const { isLimitReached, maxPerChannel } = useChannelScheduledMessageLimit(channel);
  const { failed, pending } = useMemo(
    () => ({
      failed: scheduledMessages.filter(({ status }) => status === SCHEDULED_MESSAGE_STATUS.Failed),
      pending: scheduledMessages.filter(isPendingScheduledMessage),
    }),
    [scheduledMessages],
  );
  const failedCount = failed.length;
  const pendingCount = pending.length;

  const { editedScheduledMessage } = useEditedScheduledMessage();

  // Hidden while the composer edits a scheduled message, which the banner would point back to.
  const isVisible = !editedScheduledMessage && (failedCount > 0 || pendingCount > 0);

  useEffect(() => {
    if (!isVisible) messageInputHeightStore.setBannerHeight(0);
  }, [isVisible, messageInputHeightStore]);

  useEffect(() => () => messageInputHeightStore.setBannerHeight(0), [messageInputHeightStore]);

  const isFailure = failedCount > 0;
  const count = isFailure ? failedCount : pendingCount;
  const single = isFailure ? failed[0] : pending[0];

  let label: string;
  if (isFailure) {
    label = t('scheduledMessages.banner.failed.text', '{{ count }} failed to send', {
      count: failedCount,
    });
  } else if (!thread && isLimitReached && maxPerChannel !== undefined) {
    label = t(
      'scheduledMessages.banner.limit.text',
      '{{ count }} of {{ max }} scheduled messages',
      {
        count: pendingCount,
        max: maxPerChannel,
      },
    );
  } else if (pendingCount === 1 && single) {
    label = t('scheduledMessages.banner.single.text', 'Scheduled for {{ time }}', {
      time: formatDateTime(nsToDate(single.scheduled_at)),
    });
  } else {
    label = t('scheduledMessages.banner.count.text', '{{ count }} scheduled messages', {
      count: pendingCount,
    });
  }

  // `accessibilityLiveRegion` is Android-only, so changes are announced through the SDK's announcer.
  useAnnounceOnStateChange(isVisible ? label : null);

  if (!isVisible) return null;

  const linkLabel =
    count === 1
      ? t('scheduledMessages.view.label', 'View')
      : t('scheduledMessages.viewAll.label', 'View all');

  const onPress = onScheduledMessagesBannerPress
    ? () => onScheduledMessagesBannerPress({ channel, thread: thread ?? undefined })
    : undefined;

  const Icon = isFailure ? icons.ExclamationCircle : icons.Time;

  return (
    <Animated.View
      entering={transitions.zoomIn200}
      exiting={transitions.zoomOut200}
      layout={transitions.layout200}
      onLayout={({ nativeEvent: { layout } }) =>
        messageInputHeightStore.setBannerHeight(layout.height + LIST_GAP)
      }
      pointerEvents='box-none'
      style={[styles.container, bannerTheme.container]}
    >
      <Pressable
        accessibilityHint={onPress ? linkLabel : undefined}
        accessibilityRole={onPress ? 'button' : 'text'}
        disabled={!onPress}
        onPress={onPress}
        style={[
          styles.banner,
          {
            backgroundColor: semantics.backgroundCoreElevation1,
            borderColor: semantics.borderCoreSubtle,
          },
          bannerTheme.banner,
        ]}
        testID='scheduled-messages-banner'
      >
        <Icon
          height={20}
          stroke={isFailure ? semantics.accentError : semantics.accentPrimary}
          width={20}
        />
        <Text
          numberOfLines={1}
          style={[styles.label, { color: semantics.textPrimary }, bannerTheme.label]}
        >
          {label}
        </Text>
        {onPress ? (
          <Text style={[styles.link, { color: semantics.textLink }, bannerTheme.link]}>
            {linkLabel}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
};

/**
 * The banner above the composer that sums up the scheduled messages of the channel, or of the
 * thread in a thread. It opens them through `onScheduledMessagesBannerPress`.
 */
export const ScheduledMessagesBanner = () => {
  const { channel } = useChannelContext();
  const { pendingDisposal } = useStateStore(channel.state, pendingDisposalSelector);

  // A deleted or left channel stays on screen, but can't be read or scheduled in any more.
  return pendingDisposal ? null : <ScheduledMessagesBannerContent />;
};

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    borderRadius: primitives.radiusMax,
    borderWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    gap: primitives.spacingSm,
    minHeight: 44,
    paddingHorizontal: primitives.spacingMd,
    paddingVertical: primitives.spacingSm,
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  container: {
    marginBottom: COMPOSER_GAP,
    marginHorizontal: primitives.spacingMd,
  },
  label: {
    flex: 1,
    fontSize: primitives.typographyFontSizeXs,
    fontWeight: primitives.typographyFontWeightSemiBold,
    lineHeight: primitives.typographyLineHeightNormal,
  },
  link: {
    fontSize: primitives.typographyFontSizeXs,
    fontWeight: primitives.typographyFontWeightRegular,
    lineHeight: primitives.typographyLineHeightNormal,
  },
});
