import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LocalMessage, MessageResponse } from 'stream-chat';

import { ChannelPreviewProps } from './ChannelPreview';

import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { MessageDeliveryStatus, useMessageDeliveryStatus } from '../../hooks';
import { Check, CheckAll, Time } from '../../icons';
import { primitives } from '../../theme';
import { MessageStatusTypes } from '../../utils/utils';

export type ChannelMessagePreviewDeliveryStatusProps = Pick<ChannelPreviewProps, 'channel'> & {
  message: MessageResponse | LocalMessage;
};

export const ChannelMessagePreviewDeliveryStatus = ({
  channel,
  message,
}: ChannelMessagePreviewDeliveryStatusProps) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const channelConfigExists = typeof channel?.getConfig === 'function';
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
    if (!channelConfigExists) {
      return true;
    }
    const read_events = !channel.disconnected && !!channel?.id && channel.getConfig()?.read_events;
    if (typeof read_events !== 'boolean') {
      return true;
    }
    return read_events;
  }, [channelConfigExists, channel]);

  const { status } = useMessageDeliveryStatus({
    channel,
    lastMessage: message as LocalMessage,
    isReadEventsEnabled: readEvents,
  });

  if (!channel.data?.name && membersWithoutSelf.length === 1 && !isLastMessageByCurrentUser) {
    return null;
  }

  if (!isLastMessageByCurrentUser) {
    return <Text style={styles.username}>{message?.user?.name || message?.user?.id}:</Text>;
  }

  return (
    <View style={styles.container}>
      {message.status === MessageStatusTypes.SENDING ? (
        <Time stroke={semantics.chatTextTimestamp} height={16} width={16} {...timeIcon} />
      ) : message.status === MessageStatusTypes.RECEIVED &&
        status === MessageDeliveryStatus.READ ? (
        <CheckAll stroke={semantics.accentPrimary} height={16} width={16} {...checkAllIcon} />
      ) : status === MessageDeliveryStatus.DELIVERED ? (
        <CheckAll stroke={semantics.chatTextTimestamp} height={16} width={16} {...checkAllIcon} />
      ) : status === MessageDeliveryStatus.SENT ? (
        <Check stroke={semantics.chatTextTimestamp} height={16} width={16} {...checkIcon} />
      ) : null}
      <Text style={styles.text}>{t('You')}:</Text>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      channelPreview: {
        messageDeliveryStatus: { container, text },
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
      },
    });
  }, [semantics, text, container]);
};
