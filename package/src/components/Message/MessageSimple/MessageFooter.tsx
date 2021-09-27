import React from 'react';
import { Text, View } from 'react-native';

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

import type { Attachment } from 'stream-chat';

import type { MessageStatusProps } from './MessageStatus';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import type { MessageType } from '../../../types/messageTypes';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

type MessageFooterComponentProps = {
  formattedDate: string | Date;
  isDeleted?: boolean;
};

type MessageFooterPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Pick<
  MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  | 'alignment'
  | 'members'
  | 'message'
  | 'otherAttachments'
  | 'showMessageStatus'
  | 'lastGroupMessage'
> &
  Pick<MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'MessageStatus'> &
  MessageFooterComponentProps;

const MessageFooterWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  props: MessageFooterPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    alignment,
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
      colors: { grey },
      messageSimple: {
        content: { deletedMetaText, eyeIcon, messageUser, metaContainer, metaText },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  if (isDeleted) {
    return (
      <View style={metaContainer} testID='message-deleted'>
        <Eye pathFill={isDeleted ? undefined : grey} {...eyeIcon} />
        <Text
          style={[
            {
              color: grey,
              textAlign: alignment,
            },
            metaText,
            deletedMetaText,
          ]}
        >
          {t('Only visible to you')}
        </Text>
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
          <Eye {...eyeIcon} />
          <Text
            style={[
              {
                color: grey,
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

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  prevProps: MessageFooterPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessageFooterPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
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

  const messageEqual =
    prevMessage.deleted_at === nextMessage.deleted_at &&
    prevMessage.reply_count === nextMessage.reply_count &&
    prevMessage.status === nextMessage.status &&
    prevMessage.type === nextMessage.type &&
    prevMessage.text === nextMessage.text;
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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType,
> = Partial<Pick<ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'members'>> &
  MessageFooterComponentProps & {
    alignment?: Alignment;
    lastGroupMessage?: boolean;
    message?: MessageType<At, Ch, Co, Ev, Me, Re, Us>;
    MessageStatus?: React.ComponentType<MessageStatusProps<At, Ch, Co, Ev, Me, Re, Us>>;
    otherAttachments?: Attachment<At>[];
    showMessageStatus?: boolean;
  };

export const MessageFooter = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType,
>(
  props: MessageFooterProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { alignment, lastGroupMessage, members, message, otherAttachments, showMessageStatus } =
    useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();

  const { MessageStatus } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();

  return (
    <MemoizedMessageFooter
      {...{
        alignment,
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
