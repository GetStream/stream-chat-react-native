import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { Eye } from '../../../icons';

import type { Attachment, ChannelMemberResponse } from 'stream-chat';

import type { MessageStatusPropsWithContext } from './MessageStatus';

import type { MessageType } from '../../MessageList/hooks/useMessageList';

import type { Alignment } from '../../../contexts/messageContext/MessageContext';
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

export type MessageFooterProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  alignment: Alignment;
  formattedDate: string | Date;
  members: {
    [key: string]: ChannelMemberResponse<Us>;
  };
  message: MessageType<At, Ch, Co, Ev, Me, Re, Us>;
  MessageStatus: React.ComponentType<
    Partial<MessageStatusPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>
  >;
  otherAttachments: Attachment<At>[];
  testID: string;
  isDeleted?: boolean;
  lastGroupMessage?: boolean;
  showMessageStatus?: boolean;
};

export const MessageFooter = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageFooterProps<At, Ch, Co, Ev, Me, Re, Us>,
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
