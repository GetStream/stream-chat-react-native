import React from 'react';
import {
  Image,
  ImageRequireSource,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

import type { Message } from '../../../components/MessageList/utils/insertDates';
import type { Alignment } from '../../../contexts/messagesContext/MessagesContext';
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

const iconPath: ImageRequireSource = require('../../../../images/icons/icon_path.png');

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 5,
  },
  messageRepliesText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export type MessageRepliesProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /**
   * Position of the message, either 'right' or 'left'
   */
  alignment: Alignment;
  /**
   * Whether or not the current message is part of a thread
   */
  isThreadList: boolean;
  /**
   * Current [message object](https://getstream.io/chat/docs/#message_format)
   */
  message: Message<At, Ch, Co, Ev, Me, Re, Us>;
  /**
   * Handler to open a thread on a message
   */
  openThread: () => void;
};

export const MessageReplies = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageRepliesProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { alignment, isThreadList, message, openThread } = props;
  const {
    theme: {
      colors: { primary },
      message: {
        replies: { container, image, messageRepliesText },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();
  if (isThreadList || !message.reply_count) return null;

  return (
    <TouchableOpacity
      onPress={openThread}
      style={[styles.container, container]}
      testID='message-replies'
    >
      {alignment === 'left' && (
        <Image
          source={iconPath}
          style={[
            {
              transform: [{ rotateY: '0deg' }],
            },
            image,
          ]}
          testID='message-replies-left'
        />
      )}
      <Text
        style={[
          styles.messageRepliesText,
          { color: primary },
          messageRepliesText,
        ]}
      >
        {message.reply_count === 1
          ? t('1 reply')
          : t('{{ replyCount }} replies', { replyCount: message.reply_count })}
      </Text>
      {alignment === 'right' && (
        <Image
          source={iconPath}
          style={[
            {
              transform: [{ rotateY: '180deg' }],
            },
            image,
          ]}
          testID='message-replies-right'
        />
      )}
    </TouchableOpacity>
  );
};

MessageReplies.displayName = 'MessageReplies{message{replies}}';
