import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Attachment, LocalMessage } from 'stream-chat';

import type { MessageStatusProps } from './MessageStatus';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import {
  Alignment,
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

import { primitives } from '../../../theme';
import { isEditedMessage, MessageStatusTypes } from '../../../utils/utils';
import { useShouldUseOverlayStyles } from '../hooks/useShouldUseOverlayStyles';

type MessageFooterComponentProps = {
  date?: string | Date;
  formattedDate?: string | Date;
};

type MessageFooterPropsWithContext = Pick<
  MessageContextValue,
  | 'alignment'
  | 'members'
  | 'message'
  | 'showMessageStatus'
  | 'lastGroupMessage'
  | 'isMessageAIGenerated'
> &
  Pick<MessagesContextValue, 'MessageStatus'> &
  MessageFooterComponentProps;

const MessageFooterWithContext = (props: MessageFooterPropsWithContext) => {
  const {
    alignment,
    date,
    formattedDate,
    isMessageAIGenerated,
    lastGroupMessage,
    members,
    message,
    MessageStatus,
    showMessageStatus,
  } = props;
  const styles = useStyles();

  const {
    theme: {
      messageSimple: {
        footer: { container, name, editedText },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  const isAIGenerated = useMemo(
    () => isMessageAIGenerated(message),
    [message, isMessageAIGenerated],
  );

  if (lastGroupMessage === false && message.status === MessageStatusTypes.RECEIVED) {
    return null;
  }

  const isEdited = isEditedMessage(message) && !isAIGenerated;

  return (
    <View style={[styles.container, container]} testID='message-status-time'>
      {Object.keys(members).length > 2 && alignment === 'left' && message.user?.name ? (
        <Text style={[styles.name, name]}>{message.user.name}</Text>
      ) : null}
      {showMessageStatus && <MessageStatus formattedDate={formattedDate} timestamp={date} />}
      {isEdited ? <Text style={[styles.editedText, editedText]}>{t('Edited')}</Text> : null}
    </View>
  );
};

const areEqual = (
  prevProps: MessageFooterPropsWithContext,
  nextProps: MessageFooterPropsWithContext,
) => {
  const {
    alignment: prevAlignment,
    date: prevDate,
    formattedDate: prevFormattedDate,
    lastGroupMessage: prevLastGroupMessage,
    members: prevMembers,
    message: prevMessage,
    showMessageStatus: prevShowMessageStatus,
  } = prevProps;
  const {
    alignment: nextAlignment,
    date: nextDate,
    formattedDate: nextFormattedDate,
    lastGroupMessage: nextLastGroupMessage,
    members: nextMembers,
    message: nextMessage,
    showMessageStatus: nextShowMessageStatus,
  } = nextProps;

  const alignmentEqual = prevAlignment === nextAlignment;
  if (!alignmentEqual) {
    return false;
  }

  const membersEqual = Object.keys(prevMembers).length === Object.keys(nextMembers).length;
  if (!membersEqual) {
    return false;
  }

  const lastGroupMessageEqual = prevLastGroupMessage === nextLastGroupMessage;
  if (!lastGroupMessageEqual) {
    return false;
  }

  const isPrevMessageTypeDeleted = prevMessage.type === 'deleted';
  const isNextMessageTypeDeleted = nextMessage.type === 'deleted';

  const messageEqual =
    isPrevMessageTypeDeleted === isNextMessageTypeDeleted &&
    prevMessage.reply_count === nextMessage.reply_count &&
    prevMessage.status === nextMessage.status &&
    prevMessage.type === nextMessage.type &&
    prevMessage.text === nextMessage.text &&
    prevMessage.pinned === nextMessage.pinned;
  if (!messageEqual) {
    return false;
  }

  const showMessageStatusEqual = prevShowMessageStatus === nextShowMessageStatus;
  if (!showMessageStatusEqual) {
    return false;
  }

  const dateEqual = prevDate === nextDate;
  if (!dateEqual) {
    return false;
  }

  const formattedDateEqual = prevFormattedDate === nextFormattedDate;
  if (!formattedDateEqual) {
    return false;
  }

  return true;
};

const MemoizedMessageFooter = React.memo(
  MessageFooterWithContext,
  areEqual,
) as typeof MessageFooterWithContext;

export type MessageFooterProps = Partial<Pick<ChannelContextValue, 'members'>> &
  MessageFooterComponentProps & {
    alignment?: Alignment;
    lastGroupMessage?: boolean;
    message?: LocalMessage;
    MessageStatus?: React.ComponentType<MessageStatusProps>;
    otherAttachments?: Attachment[];
    showMessageStatus?: boolean;
  };

export const MessageFooter = (props: MessageFooterProps) => {
  const { alignment, isMessageAIGenerated, lastGroupMessage, members, message, showMessageStatus } =
    useMessageContext();

  const { MessageStatus, MessageTimestamp } = useMessagesContext();

  return (
    <MemoizedMessageFooter
      {...{
        alignment,
        isMessageAIGenerated,
        lastGroupMessage,
        members,
        message,
        MessageStatus,
        MessageTimestamp,
        showMessageStatus,
      }}
      {...props}
    />
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const shouldUseOverlayStyles = useShouldUseOverlayStyles();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: primitives.spacingXxs,
        gap: primitives.spacingXs,
      },
      name: {
        color: shouldUseOverlayStyles ? semantics.textOnAccent : semantics.chatTextUsername,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
      },
      editedText: {
        color: shouldUseOverlayStyles ? semantics.textOnAccent : semantics.chatTextTimestamp,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightTight,
      },
    });
  }, [
    shouldUseOverlayStyles,
    semantics.chatTextTimestamp,
    semantics.chatTextUsername,
    semantics.textOnAccent,
  ]);
};
