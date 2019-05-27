import React from 'react';
import styled from '@stream-io/styled-components';

import iconPath from '../../images/icons/icon_path.png';

const Container = styled.TouchableOpacity`
  padding: ${({ theme }) => theme.messageReplies.container.padding}px;
  flex-direction: ${({ theme }) =>
    theme.messageReplies.container.flexDirection};
  align-items: ${({ theme }) => theme.messageReplies.container.alignItems};
`;

const MessageRepliesText = styled.Text`
  color: ${({ theme }) => theme.colors.primary};
  font-weight:  ${({ theme }) =>
    theme.messageReplies.messageRepliesText.fontWeight}
  font-size:  ${({ theme }) => theme.messageReplies.messageRepliesText.fontSize}
`;

const MessageRepliesImage = styled.Image`
  transform: ${({ pos }) =>
    pos === 'left' ? 'rotateY(0deg)' : 'rotateY(180deg)'};
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
