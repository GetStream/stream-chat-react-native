import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChannelConfig, LocalMessage, MessageResponse } from 'stream-chat';

import { ChannelPreviewProps } from './ChannelPreview';

import { useA11yLabel } from '../../a11y/hooks/useA11yLabel';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { MessageDeliveryStatus, useMessageDeliveryStatus } from '../../hooks';
import { useStateStore } from '../../hooks/useStateStore';
import { primitives } from '../../theme';
import { MessageStatusTypes } from '../../utils/utils';
import { CompositeAccessibilityProbe } from '../Accessibility/CompositeAccessibilityProbe';

const readEventsSelector = ({ readEvents }: ChannelConfig) => ({
  readEventsEnabled: readEvents.enabled,
});

export type ChannelMessagePreviewDeliveryStatusProps = Pick<ChannelPreviewProps, 'channel'> & {
  message: MessageResponse | LocalMessage;
};

export const ChannelMessagePreviewDeliveryStatus = ({
  channel,
  message,
}: ChannelMessagePreviewDeliveryStatusProps) => {
  const { client } = useChatContext();
  const { icons } = useComponentsContext();
  const { t } = useTranslationContext();
  // The resolved configuration, which combines `read_events` with anything registered through
  // `client.config.set({ channel: { readEvents } })`. Absent on partial channel mocks.
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

  // `status` exists only on local messages (`LocalMessage`), so it is read through an `in` guard.
  const messageStatus = 'status' in message ? message.status : undefined;

  const { status } = useMessageDeliveryStatus({
    channel,
    lastMessage: message,
    isReadEventsEnabled: readEvents,
  });

  const statusLabel = useA11yLabel(
    messageStatus === MessageStatusTypes.SENDING
      ? 'message.status.sending.accessibilityLabel'
      : messageStatus === MessageStatusTypes.RECEIVED && status === MessageDeliveryStatus.READ
        ? 'channelPreview.deliveryStatus.read.accessibilityLabel'
        : status === MessageDeliveryStatus.DELIVERED
          ? 'channelPreview.deliveryStatus.delivered.accessibilityLabel'
          : status === MessageDeliveryStatus.SENT
            ? 'channelPreview.deliveryStatus.sent.accessibilityLabel'
            : 'message.status.sending.accessibilityLabel',
  );

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
    <CompositeAccessibilityProbe label={statusLabel}>
      <View style={styles.container}>
        {messageStatus === MessageStatusTypes.SENDING ? (
          <icons.Time stroke={semantics.chatTextTimestamp} height={16} width={16} {...timeIcon} />
        ) : messageStatus === MessageStatusTypes.RECEIVED &&
          status === MessageDeliveryStatus.READ ? (
          <icons.CheckAll
            stroke={semantics.accentPrimary}
            height={16}
            width={16}
            {...checkAllIcon}
          />
        ) : status === MessageDeliveryStatus.DELIVERED ? (
          <icons.CheckAll
            stroke={semantics.chatTextTimestamp}
            height={16}
            width={16}
            {...checkAllIcon}
          />
        ) : status === MessageDeliveryStatus.SENT ? (
          <icons.Check stroke={semantics.chatTextTimestamp} height={16} width={16} {...checkIcon} />
        ) : null}
        <Text style={styles.text}>{t('common.you.label', 'You')}:</Text>
      </View>
    </CompositeAccessibilityProbe>
  );
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      channelPreview: {
        messageDeliveryStatus: { container, text, username },
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
        color: semantics.textTertiary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
        ...text,
      },
      username: {
        color: semantics.textTertiary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
        ...username,
      },
    });
  }, [semantics, text, username, container]);
};
