import React from 'react';
import { Text, View } from 'react-native';

import type { Attachment, ExtendableGenerics } from 'stream-chat';

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
import type { MessageType } from '../../MessageList/hooks/useMessageList';

type MessageFooterComponentProps = {
  formattedDate: string | Date;
  isDeleted?: boolean;
};

type MessageFooterPropsWithContext<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageContextValue<StreamChatClient>,
  | 'alignment'
  | 'members'
  | 'message'
  | 'otherAttachments'
  | 'showMessageStatus'
  | 'lastGroupMessage'
> &
  Pick<MessagesContextValue<StreamChatClient>, 'deletedMessagesVisibilityType' | 'MessageStatus'> &
  MessageFooterComponentProps;

const MessageFooterWithContext = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  props: MessageFooterPropsWithContext<StreamChatClient>,
) => {
  const {
    alignment,
    deletedMessagesVisibilityType,
    formattedDate,
    isDeleted,
    lastGroupMessage,
    members,
    message,
    MessageStatus,
    otherAttachments,
    showMessageStatus,
  } = props;

  const {
    theme: {
      colors: { grey, grey_dark },
      messageSimple: {
        content: { deletedMetaText, eyeIcon, messageUser, metaContainer, metaText },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  if (isDeleted) {
    return (
      <View style={metaContainer} testID='message-deleted'>
        {deletedMessagesVisibilityType === 'sender' && (
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
              {t('Only visible to you')}
            </Text>
          </>
        )}
        <Text
          style={[
            {
              color: grey,
              textAlign: alignment,
            },
            metaText,
          ]}
        >
          {formattedDate}
        </Text>
      </View>
    );
  }

  if (lastGroupMessage === false) {
    return null;
  }

  return (
    <View style={metaContainer} testID='message-status-time'>
      {otherAttachments.length && otherAttachments[0].actions ? (
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
          >
            {t('Only visible to you')}
          </Text>
        </>
      ) : null}
      {Object.keys(members).length > 2 && alignment === 'left' && message.user?.name ? (
        <Text style={[{ color: grey }, messageUser]}>{message.user.name}</Text>
      ) : null}
      {showMessageStatus && <MessageStatus />}
      <Text style={[{ color: grey, textAlign: alignment }, metaText]}>{formattedDate}</Text>
    </View>
  );
};

const areEqual = <StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics>(
  prevProps: MessageFooterPropsWithContext<StreamChatClient>,
  nextProps: MessageFooterPropsWithContext<StreamChatClient>,
) => {
  const {
    alignment: prevAlignment,
    formattedDate: prevFormattedDate,
    lastGroupMessage: prevLastGroupMessage,
    members: prevMembers,
    message: prevMessage,
    otherAttachments: prevOtherAttachments,
    showMessageStatus: prevShowMessageStatus,
  } = prevProps;
  const {
    alignment: nextAlignment,
    formattedDate: nextFormattedDate,
    lastGroupMessage: nextLastGroupMessage,
    members: nextMembers,
    message: nextMessage,
    otherAttachments: nextOtherAttachments,
    showMessageStatus: nextShowMessageStatus,
  } = nextProps;

  const alignmentEqual = prevAlignment === nextAlignment;
  if (!alignmentEqual) return false;

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

  const formattedDateEqual = prevFormattedDate === nextFormattedDate;
  if (!formattedDateEqual) return false;

  return true;
};

const MemoizedMessageFooter = React.memo(
  MessageFooterWithContext,
  areEqual,
) as typeof MessageFooterWithContext;

export type MessageFooterProps<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = Partial<Pick<ChannelContextValue<StreamChatClient>, 'members'>> &
  MessageFooterComponentProps & {
    alignment?: Alignment;
    lastGroupMessage?: boolean;
    message?: MessageType<StreamChatClient>;
    MessageStatus?: React.ComponentType<MessageStatusProps<StreamChatClient>>;
    otherAttachments?: Attachment<StreamChatClient>[];
    showMessageStatus?: boolean;
  };

export const MessageFooter = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  props: MessageFooterProps<StreamChatClient>,
) => {
  const { alignment, lastGroupMessage, members, message, otherAttachments, showMessageStatus } =
    useMessageContext<StreamChatClient>();

  const { deletedMessagesVisibilityType, MessageStatus } = useMessagesContext<StreamChatClient>();

  return (
    <MemoizedMessageFooter
      {...{
        alignment,
        deletedMessagesVisibilityType,
        lastGroupMessage,
        members,
        message,
        MessageStatus,
        otherAttachments,
        showMessageStatus,
      }}
      {...props}
    />
  );
};
