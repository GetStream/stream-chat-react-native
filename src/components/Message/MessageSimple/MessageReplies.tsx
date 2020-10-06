import React from 'react';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { styled } from '../../../styles/styledComponents';

import type { ImageRequireSource } from 'react-native';

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

const iconPath: ImageRequireSource = require('../../../images/icons/icon_path.png');

const Container = styled.TouchableOpacity`
  align-items: center;
  flex-direction: row;
  padding: 5px;
  ${({ theme }) => theme.message.replies.container.css}
`;

const MessageRepliesImage = styled.Image<{ alignment: Alignment }>`
  transform: ${({ alignment }) =>
    alignment === 'left' ? 'rotateY(0deg)' : 'rotateY(180deg)'};
  ${({ theme }) => theme.message.replies.image.css}
`;

const MessageRepliesText = styled.Text`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 12px;
  font-weight: 700;
  ${({ theme }) => theme.message.replies.messageRepliesText.css}
`;

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
  const { t } = useTranslationContext();
  if (isThreadList || !message.reply_count) return null;

  return (
    <Container onPress={openThread} testID='message-replies'>
      {alignment === 'left' && (
        <MessageRepliesImage
          alignment={alignment}
          source={iconPath}
          testID='message-replies-left'
        />
      )}
      <MessageRepliesText>
        {message.reply_count === 1
          ? t('1 reply')
          : t('{{ replyCount }} replies', { replyCount: message.reply_count })}
      </MessageRepliesText>
      {alignment === 'right' && (
        <MessageRepliesImage
          alignment={alignment}
          source={iconPath}
          testID='message-replies-right'
        />
      )}
    </Container>
  );
};
