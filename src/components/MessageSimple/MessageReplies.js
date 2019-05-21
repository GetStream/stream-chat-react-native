import React from 'react';
import styled from 'styled-components';

import iconPath from '../../images/icons/icon_path.png';

const Container = styled.TouchableOpacity`
  padding: ${(props) => props.theme.messageReplies.container.padding}px;
  flex-direction: ${(props) =>
    props.theme.messageReplies.container.flexDirection};
  align-items: ${(props) => props.theme.messageReplies.container.alignItems};
`;

const MessageRepliesText = styled.Text`
  color: ${(props) => props.theme.colors.primary};
  font-weight:  ${(props) =>
    props.theme.messageReplies.messageRepliesText.fontWeight}
  font-size:  ${(props) =>
    props.theme.messageReplies.messageRepliesText.fontSize}
`;

const MessageRepliesImage = styled.Image`
  transform: ${(props) =>
    props.pos === 'left' ? 'rotateY(0deg)' : 'rotateY(180deg)'};
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
