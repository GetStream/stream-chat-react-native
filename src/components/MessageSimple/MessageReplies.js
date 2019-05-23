import React from 'react';
import styled from 'styled-components';

import { getTheme } from '../../styles/theme';
import iconPath from '../../images/icons/icon_path.png';

const Container = styled.TouchableOpacity`
  padding: ${(props) => getTheme(props).messageReplies.container.padding}px;
  flex-direction: ${(props) =>
    getTheme(props).messageReplies.container.flexDirection};
  align-items: ${(props) =>
    getTheme(props).messageReplies.container.alignItems};
`;

const MessageRepliesText = styled.Text`
  color: ${(props) => getTheme(props).colors.primary};
  font-weight:  ${(props) =>
    getTheme(props).messageReplies.messageRepliesText.fontWeight}
  font-size:  ${(props) =>
    getTheme(props).messageReplies.messageRepliesText.fontSize}
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
