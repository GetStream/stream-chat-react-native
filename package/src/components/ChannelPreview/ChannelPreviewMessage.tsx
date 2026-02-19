import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  AttachmentManagerState,
  DraftMessage,
  LocalMessage,
  MessageResponse,
  TextComposerState,
} from 'stream-chat';

import { ChannelListMessageDeliveryStatus } from './ChannelListMessageDeliveryStatus';
import { ChannelPreviewProps } from './ChannelPreview';

import { LastMessageType } from './hooks/useChannelPreviewData';

import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { useStateStore } from '../../hooks/useStateStore';
import { CircleBan } from '../../icons/CircleBan';
import { primitives } from '../../theme';
import { MessageStatusTypes } from '../../utils/utils';
import { MessagePreview } from '../MessagePreview/MessagePreview';
import { ErrorBadge } from '../ui';

export type ChannelPreviewMessageProps = Pick<ChannelPreviewProps, 'channel'> & {
  lastMessage?: LastMessageType;
};

const textComposerStateSelector = (state: TextComposerState) => ({
  text: state.text,
});

const stateSelector = (state: AttachmentManagerState) => ({
  attachments: state.attachments,
});

export const ChannelPreviewMessage = (props: ChannelPreviewMessageProps) => {
  const { channel, lastMessage } = props;
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();
  const { client } = useChatContext();
  const { t } = useTranslationContext();

  const { text: draftText } = useStateStore(
    channel.messageComposer.textComposer.state,
    textComposerStateSelector,
  );

  const { attachments } = useStateStore(
    channel.messageComposer.attachmentManager.state,
    stateSelector,
  );

  const draftMessage: DraftMessage | undefined = useMemo(
    () =>
      !channel.messageComposer.compositionIsEmpty
        ? attachments && draftText
          ? {
              attachments,
              id: channel.messageComposer.id,
              text: draftText,
            }
          : undefined
        : undefined,
    [channel.messageComposer, attachments, draftText],
  );

  const membersWithoutSelf = useMemo(() => {
    return Object.values(channel.state.members).filter(
      (member) => member.user?.id !== client.user?.id,
    );
  }, [channel.state.members, client.user?.id]);

  const isFailedMessage =
    lastMessage?.status === MessageStatusTypes.FAILED || lastMessage?.type === 'error';

  const renderMessagePreview = (message: LocalMessage | MessageResponse | DraftMessage) => {
    // If the last message is deleted, show a message saying "Message deleted"
    if (lastMessage?.type === 'deleted') {
      return (
        <View style={styles.container}>
          <CircleBan height={16} width={16} stroke={semantics.textTertiary} />
          <Text style={styles.message}>Message deleted</Text>
        </View>
      );
    }

    if (isFailedMessage) {
      return (
        <View style={styles.container}>
          <ErrorBadge size='xs' />
          <Text style={styles.errorText}>Message failed to send</Text>
        </View>
      );
    }

    return (
      <MessagePreview
        message={message}
        textStyle={styles.subtitle}
        iconProps={{ width: 16, height: 16, stroke: semantics.textSecondary }}
      />
    );
  };

  if (draftMessage) {
    return (
      <View style={styles.container}>
        <Text style={styles.draftText}>{t('Draft:')}</Text>
        {renderMessagePreview(draftMessage)}
      </View>
    );
  }

  // If there are no messages yet, show a message saying "No messages yet"
  if (!lastMessage) {
    return <Text style={styles.message}>No messages yet</Text>;
  }

  if (channel.data?.name) {
    return (
      <View style={styles.container}>
        {lastMessage?.user?.id === client.user?.id ? (
          <ChannelListMessageDeliveryStatus channel={channel} lastMessage={lastMessage} />
        ) : (
          <Text style={styles.username}>{lastMessage?.user?.name || lastMessage?.user?.id}:</Text>
        )}
        {renderMessagePreview(lastMessage)}
      </View>
    );
  } else {
    if (membersWithoutSelf.length === 0) {
      return (
        <View style={styles.container}>
          <ChannelListMessageDeliveryStatus channel={channel} lastMessage={lastMessage} />
          {renderMessagePreview(lastMessage)}
        </View>
      );
    } else if (membersWithoutSelf.length === 1) {
      return (
        <View style={styles.container}>
          {lastMessage?.user?.id === client.user?.id ? (
            <ChannelListMessageDeliveryStatus channel={channel} lastMessage={lastMessage} />
          ) : null}

          {renderMessagePreview(lastMessage)}
        </View>
      );
    } else {
      return (
        <View style={styles.container}>
          {lastMessage?.user?.id === client.user?.id ? (
            <ChannelListMessageDeliveryStatus channel={channel} lastMessage={lastMessage} />
          ) : (
            <Text style={styles.username}>{lastMessage?.user?.name || lastMessage?.user?.id}:</Text>
          )}
          {renderMessagePreview(lastMessage)}
        </View>
      );
    }
  }
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
        flexShrink: 1,
      },
      username: {
        color: semantics.textTertiary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
      },
      message: {
        color: semantics.textTertiary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightNormal,
      },
      subtitle: {
        color: semantics.textSecondary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightRegular,
        includeFontPadding: false,
        lineHeight: primitives.typographyLineHeightNormal,
      },
      draftText: {
        color: semantics.accentPrimary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
      },
      errorText: {
        color: semantics.accentError,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightRegular,
        includeFontPadding: false,
        lineHeight: primitives.typographyLineHeightNormal,
      },
    });
  }, [semantics]);
};
