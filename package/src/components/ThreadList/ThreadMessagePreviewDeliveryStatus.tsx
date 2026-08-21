import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Channel, ChannelConfig, LocalMessage } from 'stream-chat';

import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { MessageDeliveryStatus, useMessageDeliveryStatus } from '../../hooks';
import { useStateStore } from '../../hooks/useStateStore';
import { primitives } from '../../theme';
import { MessageStatusTypes } from '../../utils/utils';

/**
 * Module scope so the reference stays stable — an inline selector re-subscribes on every render.
 */
const readEventsSelector = ({ readEvents }: ChannelConfig) => ({
  readEventsEnabled: readEvents.enabled,
});

export type ThreadMessagePreviewDeliveryStatusProps = {
  channel: Channel;
  message: LocalMessage;
};

export const ThreadMessagePreviewDeliveryStatus = ({
  channel,
  message,
}: ThreadMessagePreviewDeliveryStatusProps) => {
  const { client } = useChatContext();
  const { icons } = useComponentsContext();
  const { t } = useTranslationContext();
  // `configState` is absent on the partial channel mocks some tests pass in; a real channel always
  // has one. Resolved configuration, so `read_events` is already ANDed with anything registered
  // through `client.config.set({ channel: { readEvents } })`.
  const configState = channel?.configState;
  const { readEventsEnabled } = useStateStore(configState, readEventsSelector) ?? {};
  const styles = useStyles();
  const {
    theme: {
      channelPreview: {
        messageDeliveryStatus: { checkAllIcon, checkIcon, timeIcon },
      },
      semantics,
    },
  } = useTheme();

  const membersWithoutSelf = useMemo(() => {
    return Object.values(channel.state?.members || {}).filter(
      (member) => member.user?.id !== client.user?.id,
    );
  }, [channel.state?.members, client.user?.id]);

  const isLastMessageByCurrentUser = useMemo(() => {
    return message?.user?.id === client.user?.id;
  }, [message, client.user?.id]);

  const readEvents = useMemo(() => {
    if (!configState) {
      return true;
    }
    const read_events = !channel.pendingDisposal && !!channel?.id && readEventsEnabled;
    if (typeof read_events !== 'boolean') {
      return true;
    }
    return read_events;
  }, [configState, readEventsEnabled, channel]);

  const { status } = useMessageDeliveryStatus({
    channel,
    lastMessage: message,
    isReadEventsEnabled: readEvents,
  });

  if (
    !channel.data?.custom?.name &&
    membersWithoutSelf.length === 1 &&
    !isLastMessageByCurrentUser
  ) {
    return null;
  }

  if (!isLastMessageByCurrentUser) {
    return <Text style={styles.username}>{message?.user?.name || message?.user?.id}:</Text>;
  }

  return (
    <View style={styles.container}>
      {message.status === MessageStatusTypes.SENDING ? (
        <icons.Time stroke={semantics.chatTextTimestamp} height={20} width={20} {...timeIcon} />
      ) : message.status === MessageStatusTypes.RECEIVED &&
        status === MessageDeliveryStatus.READ ? (
        <icons.CheckAll stroke={semantics.accentPrimary} height={20} width={20} {...checkAllIcon} />
      ) : status === MessageDeliveryStatus.DELIVERED ? (
        <icons.CheckAll
          stroke={semantics.chatTextTimestamp}
          height={20}
          width={20}
          {...checkAllIcon}
        />
      ) : status === MessageDeliveryStatus.SENT ? (
        <icons.Check stroke={semantics.chatTextTimestamp} height={20} width={20} {...checkIcon} />
      ) : null}
      <Text style={styles.text}>{t('common.you.label', 'You')}:</Text>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      threadListItem: {
        messagePreviewDeliveryStatus: { container, text, username },
      },
    },
  } = useTheme();

  return useMemo(() => {
    return StyleSheet.create({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: primitives.spacingXxs,
        ...container,
      },
      text: {
        color: semantics.textSecondary,
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
        ...text,
      },
      username: {
        color: semantics.textSecondary,
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
        ...username,
      },
    });
  }, [semantics, text, container, username]);
};
