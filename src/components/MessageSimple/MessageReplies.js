import React from 'react';
import styled from '@stream-io/styled-components';

import iconPath from '../../images/icons/icon_path.png';

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
  transform: ${({ pos }) =>
    pos === 'left' ? 'rotateY(0deg)' : 'rotateY(180deg)'};
  ${({ theme }) => theme.message.replies.image.css}
`;

export const MessageReplies = ({ message, isThreadList, openThread, pos }) => {
  if (isThreadList || !message.reply_count) return null;

  return (
    <Container onPress={openThread}>
      {pos === 'left' ? <MessageRepliesImage source={iconPath} /> : null}
      <MessageRepliesText>
        {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
      </MessageRepliesText>
      {pos === 'right' ? <MessageRepliesImage source={iconPath} /> : null}
    </Container>
  );
};
