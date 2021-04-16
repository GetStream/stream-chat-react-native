import React from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import merge from 'lodash/merge';

import { MessageTextContainer } from './MessageTextContainer';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import type { TDateTimeParserInput } from '../../../contexts/translationContext/TranslationContext';

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

const styles = StyleSheet.create({
  containerInner: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  leftAlignItems: {
    alignItems: 'flex-start',
  },
  rightAlignItems: {
    alignItems: 'flex-end',
  },
});

type MessageDeletedContextProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<
  MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  'alignment' | 'members' | 'message' | 'otherAttachments' | 'showMessageStatus'
> &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'formatDate' | 'MessageStatus' | 'MessageFooter'
  >;

type MessageDeletedComponentProps = {
  getDateText: (
    formatter?: ((date: TDateTimeParserInput) => string) | undefined,
  ) => string | Date;
  groupStyle: string;
  noBorder: boolean;
  onLayout: (event: LayoutChangeEvent) => void;
};

type MessageDeletedPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = MessageDeletedComponentProps &
  MessageDeletedContextProps<At, Ch, Co, Ev, Me, Re, Us>;

const MessageDeletedWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageDeletedPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    alignment,
    formatDate,
    getDateText,
    groupStyle,
    members,
    message,
    MessageFooter,
    MessageStatus,
    noBorder,
    onLayout,
    otherAttachments,
    showMessageStatus,
  } = props;

  const {
    theme: {
      colors: {
        grey,

        grey_whisper,
      },
      messageSimple: {
        content: {
          container: { borderRadiusL, borderRadiusS },
          deletedContainer,
          deletedContainerInner,
          deletedText,
        },
      },
    },
  } = useTheme();

  return (
    <View
      onLayout={onLayout}
      style={[
        alignment === 'left' ? styles.leftAlignItems : styles.rightAlignItems,
        deletedContainer,
      ]}
    >
      <View
        style={[
          styles.containerInner,
          {
            backgroundColor: grey_whisper,
            borderBottomLeftRadius:
              groupStyle === 'left_bottom' || groupStyle === 'left_single'
                ? borderRadiusS
                : borderRadiusL,
            borderBottomRightRadius:
              groupStyle === 'right_bottom' || groupStyle === 'right_single'
                ? borderRadiusS
                : borderRadiusL,
            borderColor: grey_whisper,
          },
          noBorder ? { borderWidth: 0 } : {},
          deletedContainerInner,
        ]}
        testID='message-content-wrapper'
      >
        <MessageTextContainer<At, Ch, Co, Ev, Me, Re, Us>
          markdownStyles={merge({ em: { color: grey } }, deletedText)}
          message={{ ...message, text: '_Message deleted_' }}
        />
      </View>
      <MessageFooter
        alignment={alignment}
        formattedDate={getDateText(formatDate)}
        isDeleted
        members={members}
        message={message}
        MessageStatus={MessageStatus}
        otherAttachments={otherAttachments}
        showMessageStatus={showMessageStatus}
        testID='message-footer'
      />
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
  prevProps: MessageDeletedPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessageDeletedPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    alignment: prevAlignment,
    formatDate: prevFormatDate,
    members: prevMembers,
    message: prevMessage,
    otherAttachments: prevOtherAttachments,
    showMessageStatus: prevShowMessageStatus,
  } = prevProps;
  const {
    alignment: nextAlignment,
    formatDate: nextFormatDate,
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

  const formatDateEqual = prevFormatDate === nextFormatDate;
  if (!formatDateEqual) return false;

  return true;
};

const MemoizedMessageDeleted = React.memo(
  MessageDeletedWithContext,
  areEqual,
) as typeof MessageDeletedWithContext;

export type MessageDeletedProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
> = MessageDeletedComponentProps &
  Partial<MessageDeletedContextProps<At, Ch, Co, Ev, Me, Re, Us>>;

export const MessageDeleted = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>(
  props: MessageDeletedProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    alignment,
    members,
    message,
    otherAttachments,
    showMessageStatus,
  } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();

  const { formatDate, MessageFooter, MessageStatus } = useMessagesContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  return (
    <MemoizedMessageDeleted
      {...{
        alignment,
        formatDate,
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

MessageDeleted.displayName = 'MessageDeleted{messageSimple{content}}';
