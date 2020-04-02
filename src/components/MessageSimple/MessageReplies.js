import React from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import iconPath from '../../images/icons/icon_path.png';
import { withTranslationContext } from '../../context';

const Container = styled.TouchableOpacity`
  padding: 5px;
  flex-direction: row;
  align-items: center;
  ${({ theme }) => theme.message.replies.container.css}
`;

const MessageRepliesText = styled.Text`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 700;
  font-size: 12;
  ${({ theme }) => theme.message.replies.messageRepliesText.css}
`;

const MessageRepliesImage = styled.Image`
  transform: ${({ alignment }) =>
    alignment === 'left' ? 'rotateY(0deg)' : 'rotateY(180deg)'};
  ${({ theme }) => theme.message.replies.image.css}
`;

const MessageReplies = ({
  message,
  isThreadList,
  openThread,
  alignment,
  t,
}) => {
  if (isThreadList || !message.reply_count) return null;

  return (
    <Container onPress={openThread}>
      {alignment === 'left' ? (
        <MessageRepliesImage source={iconPath} alignment={alignment} />
      ) : null}
      <MessageRepliesText>
        {message.reply_count === 1
          ? t('1 reply')
          : t('{{ replyCount }} replies', { replyCount: message.reply_count })}
      </MessageRepliesText>
      {alignment === 'right' ? (
        <MessageRepliesImage source={iconPath} alignment={alignment} />
      ) : null}
    </Container>
  );
};

MessageReplies.propTypes = {
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: PropTypes.object,
  /** Boolean if current message is part of thread */
  isThreadList: PropTypes.bool,
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
  openThread: PropTypes.func,
  /** right | left */
  alignment: PropTypes.oneOf(['right', 'left']),
};

const MessageRepliesWithContext = withTranslationContext(MessageReplies);

export { MessageRepliesWithContext as MessageReplies };
