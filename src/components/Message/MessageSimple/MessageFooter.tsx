import React from 'react';
import { Text, View } from 'react-native';

import {
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

type MessageFooterContextProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<
  MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  | 'alignment'
  | 'members'
  | 'message'
  | 'otherAttachments'
  | 'showMessageStatus'
  | 'lastGroupMessage'
> &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'MessageStatus' | 'MessageFooter'
  >;

type MessageFooterComponentProps = {
  formattedDate: string | Date;
  testID: string;
  isDeleted?: boolean;
};

type MessageFooterPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = MessageFooterComponentProps &
  MessageFooterContextProps<At, Ch, Co, Ev, Me, Re, Us>;

const MessageFooterWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
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
    testID,
  } = props;

  const {
    theme: {
      colors: { grey },
      messageSimple: {
        content: {
          deletedMetaText,
          eyeIcon,
          messageUser,
          metaContainer,
          metaText,
        },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  if (isDeleted) {
    return (
      <View style={metaContainer} testID={testID}>
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
      {Object.keys(members).length > 2 &&
      alignment === 'left' &&
      message.user?.name ? (
        <Text style={[{ color: grey }, messageUser]}>{message.user.name}</Text>
      ) : null}
      {showMessageStatus && <MessageStatus />}
      <Text style={[{ color: grey, textAlign: alignment }, metaText]}>
        {formattedDate}
      </Text>
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
  Us extends UnknownType = DefaultUserType
>(
  prevProps: MessageFooterPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessageFooterPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    alignment: prevAlignment,
    formattedDate: prevFormattedDate,
    members: prevMembers,
    message: prevMessage,
    otherAttachments: prevOtherAttachments,
    showMessageStatus: prevShowMessageStatus,
  } = prevProps;
  const {
    alignment: nextAlignment,
    formattedDate: nextFormattedDate,
    members: nextMembers,
    message: nextMessage,
    otherAttachments: nextOtherAttachments,
    showMessageStatus: nextShowMessageStatus,
  } = nextProps;

  const alignmentEqual = prevAlignment === nextAlignment;
  if (!alignmentEqual) return false;

  const membersEqual = prevMembers === nextMembers;
  if (!membersEqual) return false;

  const messageEqual = prevMessage === nextMessage;
  if (!messageEqual) return false;

  const otherAttachmentsEqual = prevOtherAttachments === nextOtherAttachments;
  if (!otherAttachmentsEqual) return false;

  const showMessageStatusEqual =
    prevShowMessageStatus === nextShowMessageStatus;
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
  Us extends DefaultUserType = DefaultUserType
> = MessageFooterComponentProps &
  Partial<MessageFooterContextProps<At, Ch, Co, Ev, Me, Re, Us>>;

export const MessageFooter = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>(
  props: MessageFooterProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    alignment,
    lastGroupMessage,
    members,
    message,
    otherAttachments,
    showMessageStatus,
  } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();

  const { MessageFooter, MessageStatus } = useMessagesContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  return (
    <MemoizedMessageFooter
      {...{
        alignment,
        lastGroupMessage,
        members,
        message,
        MessageFooter,
        MessageStatus,
        otherAttachments,
        showMessageStatus,
      }}
      {...props}
    />
  );
};
