import React from 'react';
import { Text, TouchableOpacity, Image } from 'react-native';

import styled from 'styled-components';

import iconPath from '../../images/icons/icon_path.png';

const Container = styled.TouchableOpacity`
  padding: 5px;
  flex-direction: row;
`

const MessageRepliesText = styled.Text`
  color: ${(props) => props.theme.colors.primary};
`

const MessageRepliesImage = styled.Image`
  transform: ${(props) => props.pos === 'left' ? 'rotateY(0deg)' : 'rotateY(180deg)'}
`

export const MessageReplies = ({ message, isThreadList, openThread, pos }) => {
  if (isThreadList || !message.reply_count) return null;

  return (
    <Container
      onPress={openThread}
      >
      {pos === 'left' ? <MessageRepliesImage source={iconPath} /> : null}
      <MessageRepliesText>
        {message.reply_count} {message.reply_count === 1 ? 'Reply' : 'Replies'}
      </MessageRepliesText>
      {pos === 'right' ? (
        <MessageRepliesImage

          source={iconPath}
        />
      ) : null}
    </Container>
  );
};
