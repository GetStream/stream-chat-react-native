import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChannelLastMessagePreview } from './ChannelLastMessagePreview';
import { ChannelMessagePreviewDeliveryStatus } from './ChannelMessagePreviewDeliveryStatus';
import { ChannelPreviewProps } from './ChannelPreview';

import { ChannelPreviewTypingIndicator } from './ChannelPreviewTypingIndicator';
import { LastMessageType } from './hooks/useChannelPreviewData';

import { useChannelPreviewDraftMessage } from './hooks/useChannelPreviewDraftMessage';
import { useChannelPreviewPollLabel } from './hooks/useChannelPreviewPollLabel';

import { useChannelTypingState } from './hooks/useChannelTypingState';

import {
  ChannelsContextValue,
  useChannelsContext,
} from '../../contexts/channelsContext/ChannelsContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { PollIcon } from '../../icons/PollIcon';
import { primitives } from '../../theme';
import { MessageStatusTypes } from '../../utils/utils';
import { ErrorBadge } from '../ui';

export type ChannelPreviewMessageProps = Pick<ChannelPreviewProps, 'channel'> &
  Partial<
    Pick<
      ChannelsContextValue,
      'PreviewTypingIndicator' | 'PreviewMessageDeliveryStatus' | 'PreviewLastMessage'
    >
  > & {
    lastMessage?: LastMessageType;
  };

export const ChannelPreviewMessage = (props: ChannelPreviewMessageProps) => {
  const {
    channel,
    lastMessage,
    PreviewTypingIndicator: PreviewTypingIndicatorProp = ChannelPreviewTypingIndicator,
    PreviewMessageDeliveryStatus:
      PreviewMessageDeliveryStatusProp = ChannelMessagePreviewDeliveryStatus,
    PreviewLastMessage: PreviewLastMessageProp = ChannelLastMessagePreview,
  } = props;
  const {
    PreviewTypingIndicator: PreviewTypingIndicatorContext,
    PreviewMessageDeliveryStatus: PreviewMessageDeliveryStatusContext,
    PreviewLastMessage: PreviewLastMessageContext,
  } = useChannelsContext();
  const PreviewTypingIndicator = PreviewTypingIndicatorProp || PreviewTypingIndicatorContext;
  const PreviewMessageDeliveryStatus =
    PreviewMessageDeliveryStatusProp || PreviewMessageDeliveryStatusContext;
  const PreviewLastMessage = PreviewLastMessageProp || PreviewLastMessageContext;
  const {
    theme: { semantics },
  } = useTheme();
  const isMessageDeleted = lastMessage?.type === 'deleted';
  const styles = useStyles({ isMessageDeleted });
  const { client } = useChatContext();
  const { t } = useTranslationContext();

  const { usersTyping } = useChannelTypingState({ channel });

  const draftMessage = useChannelPreviewDraftMessage({ channel });

  const pollLabel = useChannelPreviewPollLabel({ pollId: lastMessage?.poll_id ?? '' });

  const membersWithoutSelf = useMemo(() => {
    return Object.values(channel.state.members).filter(
      (member) => member.user?.id !== client.user?.id,
    );
  }, [channel.state.members, client.user?.id]);

  const isFailedMessage =
    lastMessage?.status === MessageStatusTypes.FAILED || lastMessage?.type === 'error';

  if (usersTyping.length > 0) {
    return <PreviewTypingIndicator channel={channel} usersTyping={usersTyping} />;
  }

  if (draftMessage) {
    return (
      <View style={styles.container}>
        <Text style={styles.draftText}>{t('Draft')}:</Text>
        <PreviewLastMessage message={draftMessage} />
      </View>
    );
  }

  // If there are no messages yet, show a message saying "No messages yet"
  if (!lastMessage) {
    return (
      <Text style={[styles.subtitle, { color: semantics.textTertiary }]}>
        {t('No messages yet')}
      </Text>
    );
  }

  if (pollLabel) {
    return (
      <View style={styles.container}>
        <PollIcon height={16} width={16} stroke={semantics.textSecondary} />
        <Text style={styles.subtitle}>{pollLabel}</Text>
      </View>
    );
  }

  if (isFailedMessage) {
    return (
      <View style={styles.container}>
        <ErrorBadge size='xs' />
        <Text style={styles.errorText}>{t('Message failed to send')}</Text>
      </View>
    );
  }

  if (channel.data?.name || membersWithoutSelf.length > 1) {
    return (
      <View style={styles.container}>
        <PreviewMessageDeliveryStatus channel={channel} message={lastMessage} />
        <PreviewLastMessage message={lastMessage} />
      </View>
    );
  } else {
    return (
      <View style={styles.container}>
        <PreviewMessageDeliveryStatus channel={channel} message={lastMessage} />
        <PreviewLastMessage message={lastMessage} />
      </View>
    );
  }
};

const useStyles = ({ isMessageDeleted = false }: { isMessageDeleted?: boolean }) => {
  const {
    theme: {
      semantics,
      channelPreview: { message },
    },
  } = useTheme();

  return useMemo(() => {
    return StyleSheet.create({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: primitives.spacingXxs,
        flexShrink: 1,
        ...message.container,
      },
      subtitle: {
        color: isMessageDeleted ? semantics.textTertiary : semantics.textSecondary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightRegular,
        includeFontPadding: false,
        lineHeight: primitives.typographyLineHeightNormal,
        flexShrink: 1,
        ...message.subtitle,
      },
      draftText: {
        color: semantics.accentPrimary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
        includeFontPadding: false,
        ...message.draftText,
      },
      errorText: {
        color: semantics.accentError,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightRegular,
        includeFontPadding: false,
        lineHeight: primitives.typographyLineHeightNormal,
        ...message.errorText,
      },
    });
  }, [semantics, isMessageDeleted, message]);
};
