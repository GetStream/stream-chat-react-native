import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Attachment } from 'stream-chat';

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
import { Eye } from '../../../icons';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import { isEditedMessage, MessageStatusTypes } from '../../../utils/utils';
import type { MessageType } from '../../MessageList/hooks/useMessageList';

type MessageFooterComponentProps = {
  date?: string | Date;
  formattedDate?: string | Date;
  isDeleted?: boolean;
};

type MessageFooterPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageContextValue<StreamChatGenerics>,
  | 'alignment'
  | 'isEditedMessageOpen'
  | 'members'
  | 'message'
  | 'otherAttachments'
  | 'showMessageStatus'
  | 'lastGroupMessage'
> &
  Pick<
    MessagesContextValue<StreamChatGenerics>,
    | 'deletedMessagesVisibilityType'
    | 'MessageEditedTimestamp'
    | 'MessageStatus'
    | 'MessageTimestamp'
  > &
  MessageFooterComponentProps;

const OnlyVisibleToYouComponent = ({ alignment }: { alignment: Alignment }) => {
  const {
    theme: {
      colors: { grey_dark },
      messageSimple: {
        content: { deletedMetaText, eyeIcon, metaText },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  return (
    <>
      <Eye pathFill={grey_dark} {...eyeIcon} />
      <Text
        style={[
          {
            color: grey_dark,
            textAlign: alignment,
          },
          metaText,
          deletedMetaText,
        ]}
        testID='only-visible-to-you'
      >
        {t<string>('Only visible to you')}
      </Text>
    </>
  );
};

const MessageFooterWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageFooterPropsWithContext<StreamChatGenerics>,
) => {
  const {
    alignment,
    date,
    deletedMessagesVisibilityType,
    formattedDate,
    isDeleted,
    isEditedMessageOpen,
    lastGroupMessage,
    members,
    message,
    MessageEditedTimestamp,
    MessageStatus,
    MessageTimestamp,
    otherAttachments,
    showMessageStatus,
  } = props;

  const {
    theme: {
      colors: { grey },
      messageSimple: {
        content: { editedLabel, messageUser, metaContainer, metaText },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  if (isDeleted) {
    return (
      <View style={[styles.container, metaContainer]} testID='message-deleted'>
        {deletedMessagesVisibilityType === 'sender' && (
          <OnlyVisibleToYouComponent alignment={alignment} />
        )}
        <MessageTimestamp formattedDate={formattedDate} timestamp={date} />
      </View>
    );
  }

  if (lastGroupMessage === false && message.status === MessageStatusTypes.RECEIVED) {
    return null;
  }

  return (
    <>
      <View style={[styles.container, metaContainer]} testID='message-status-time'>
        {otherAttachments.length && otherAttachments[0].actions ? (
          <OnlyVisibleToYouComponent alignment={alignment} />
        ) : null}
        {Object.keys(members).length > 2 && alignment === 'left' && message.user?.name ? (
          <Text style={[styles.text, { color: grey }, messageUser]}>{message.user.name}</Text>
        ) : null}
        {showMessageStatus && <MessageStatus />}
        <MessageTimestamp formattedDate={formattedDate} timestamp={date} />

        {isEditedMessage(message) && !isEditedMessageOpen && (
          <>
            <Text
              style={[
                styles.dotText,
                {
                  color: grey,
                  textAlign: alignment,
                },
                metaText,
              ]}
            >
              ⦁
            </Text>
            <Text style={[styles.text, { color: grey, textAlign: alignment }, editedLabel]}>
              {t<string>('Edited')}
            </Text>
          </>
        )}
      </View>
      {isEditedMessageOpen && (
        <MessageEditedTimestamp message={message} MessageTimestamp={MessageTimestamp} />
      )}
    </>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MessageFooterPropsWithContext<StreamChatGenerics>,
  nextProps: MessageFooterPropsWithContext<StreamChatGenerics>,
) => {
  const {
    alignment: prevAlignment,
    date: prevDate,
    formattedDate: prevFormattedDate,
    isEditedMessageOpen: prevIsEditedMessageOpen,
    lastGroupMessage: prevLastGroupMessage,
    members: prevMembers,
    message: prevMessage,
    otherAttachments: prevOtherAttachments,
    showMessageStatus: prevShowMessageStatus,
  } = prevProps;
  const {
    alignment: nextAlignment,
    date: nextDate,
    formattedDate: nextFormattedDate,
    isEditedMessageOpen: nextIsEditedMessageOpen,
    lastGroupMessage: nextLastGroupMessage,
    members: nextMembers,
    message: nextMessage,
    otherAttachments: nextOtherAttachments,
    showMessageStatus: nextShowMessageStatus,
  } = nextProps;

  const alignmentEqual = prevAlignment === nextAlignment;
  if (!alignmentEqual) return false;

  const isEditedMessageOpenEqual = prevIsEditedMessageOpen === nextIsEditedMessageOpen;
  if (!isEditedMessageOpenEqual) return false;

  const membersEqual = Object.keys(prevMembers).length === Object.keys(nextMembers).length;
  if (!membersEqual) return false;

  const lastGroupMessageEqual = prevLastGroupMessage === nextLastGroupMessage;
  if (!lastGroupMessageEqual) return false;

  const deletedMessagesVisibilityTypeEqual =
    prevProps.deletedMessagesVisibilityType === nextProps.deletedMessagesVisibilityType;
  if (!deletedMessagesVisibilityTypeEqual) return false;

  const isPrevMessageTypeDeleted = prevMessage.type === 'deleted';
  const isNextMessageTypeDeleted = nextMessage.type === 'deleted';

  const messageEqual =
    isPrevMessageTypeDeleted === isNextMessageTypeDeleted &&
    prevMessage.reply_count === nextMessage.reply_count &&
    prevMessage.status === nextMessage.status &&
    prevMessage.type === nextMessage.type &&
    prevMessage.text === nextMessage.text &&
    prevMessage.pinned === nextMessage.pinned;
  if (!messageEqual) return false;

  const otherAttachmentsEqual =
    prevOtherAttachments.length === nextOtherAttachments.length &&
    prevOtherAttachments?.[0]?.actions?.length === nextOtherAttachments?.[0]?.actions?.length;
  if (!otherAttachmentsEqual) return false;

  const showMessageStatusEqual = prevShowMessageStatus === nextShowMessageStatus;
  if (!showMessageStatusEqual) return false;

  const dateEqual = prevDate === nextDate;
  if (!dateEqual) return false;

  const formattedDateEqual = prevFormattedDate === nextFormattedDate;
  if (!formattedDateEqual) return false;

  return true;
};

const MemoizedMessageFooter = React.memo(
  MessageFooterWithContext,
  areEqual,
) as typeof MessageFooterWithContext;

export type MessageFooterProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<Pick<ChannelContextValue<StreamChatGenerics>, 'members'>> &
  MessageFooterComponentProps & {
    alignment?: Alignment;
    lastGroupMessage?: boolean;
    message?: MessageType<StreamChatGenerics>;
    MessageStatus?: React.ComponentType<MessageStatusProps<StreamChatGenerics>>;
    otherAttachments?: Attachment<StreamChatGenerics>[];
    showMessageStatus?: boolean;
  };

export const MessageFooter = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageFooterProps<StreamChatGenerics>,
) => {
  const {
    alignment,
    isEditedMessageOpen,
    lastGroupMessage,
    members,
    message,
    otherAttachments,
    showMessageStatus,
  } = useMessageContext<StreamChatGenerics>();

  const { deletedMessagesVisibilityType, MessageEditedTimestamp, MessageStatus, MessageTimestamp } =
    useMessagesContext<StreamChatGenerics>();

  return (
    <MemoizedMessageFooter
      {...{
        alignment,
        deletedMessagesVisibilityType,
        isEditedMessageOpen,
        lastGroupMessage,
        members,
        message,
        MessageEditedTimestamp,
        MessageStatus,
        MessageTimestamp,
        otherAttachments,
        showMessageStatus,
      }}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  dotText: {
    paddingHorizontal: 4,
  },
  text: {
    fontSize: 12,
  },
});
