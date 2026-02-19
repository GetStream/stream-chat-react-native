import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LocalMessage } from 'stream-chat';

import { ChannelPreviewProps } from './ChannelPreview';
import { LastMessageType } from './hooks/useChannelPreviewData';

import { MessageDeliveryStatus, useMessageDeliveryStatus } from './hooks/useMessageDeliveryStatus';

import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { Check, CheckAll, Time } from '../../icons';
import { primitives } from '../../theme';
import { MessageStatusTypes } from '../../utils/utils';

export type ChannelListMessageDeliveryStatusProps = Pick<ChannelPreviewProps, 'channel'> & {
  lastMessage: LastMessageType;
};

export const ChannelListMessageDeliveryStatus = ({
  channel,
  lastMessage,
}: ChannelListMessageDeliveryStatusProps) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const channelConfigExists = typeof channel?.getConfig === 'function';
  const styles = useStyles();
  const {
    theme: {
      channelPreview: { checkAllIcon, checkIcon, timeIcon },
      semantics,
    },
  } = useTheme();

  const isFailedMessage =
    lastMessage?.status === MessageStatusTypes.FAILED || lastMessage?.type === 'error';

  const isLastMessageByCurrentUser = useMemo(() => {
    return lastMessage?.user?.id === client.user?.id;
  }, [lastMessage, client.user?.id]);

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
    lastMessage: lastMessage as LocalMessage,
    isReadEventsEnabled: readEvents,
  });

  if (!isLastMessageByCurrentUser || isFailedMessage) {
    return null;
  }

  return (
    <View style={styles.container}>
      {lastMessage.status === MessageStatusTypes.SENDING ? (
        <Time stroke={semantics.chatTextTimestamp} height={16} width={16} {...timeIcon} />
      ) : lastMessage.status === MessageStatusTypes.RECEIVED &&
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
    theme: { semantics },
  } = useTheme();

  return useMemo(() => {
    return StyleSheet.create({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: primitives.spacingXxs,
      },
      text: {
        color: semantics.textTertiary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
      },
    });
  }, [semantics]);
};
