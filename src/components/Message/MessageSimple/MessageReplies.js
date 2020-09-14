import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components/native';

import { TranslationContext } from '../../../context';
import iconPath from '../../../images/icons/icon_path.png';

const Container = styled.TouchableOpacity`
  align-items: center;
  flex-direction: row;
  padding: 5px;
  ${({ theme }) => theme.message.replies.container.css}
`;

const MessageRepliesImage = styled.Image`
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

const MessageReplies = ({ alignment, isThreadList, message, openThread }) => {
  const { t } = useContext(TranslationContext);
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

MessageReplies.propTypes = {
  /** right | left */
  alignment: PropTypes.oneOf(['right', 'left']),
  /** Boolean if current message is part of thread */
  isThreadList: PropTypes.bool,
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: PropTypes.object,
  /**
   * Handler to open the thread on message. This function runs on press of the replies button.
   *
   * @param message A message object to open the thread upon.
   * */
  openThread: PropTypes.func,
};

export default MessageReplies;
