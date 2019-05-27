import React from 'react';
import styled from '@stream-io/styled-components';

import { renderText, capitalize } from '../../utils';

const TextContainer = styled.View`
  border-bottom-left-radius: ${({ theme, groupStyle }) =>
    groupStyle.indexOf('left') !== -1
      ? theme.messageText.borderRadiusS
      : theme.messageText.borderBottomLeftRadius};
  border-bottom-right-radius: ${({ theme, groupStyle }) =>
    groupStyle.indexOf('right') !== -1
      ? theme.messageText.borderRadiusS
      : theme.messageText.borderBottomRightRadius};
  border-top-left-radius: ${({ theme, groupStyle }) =>
    groupStyle === 'leftBottom' || groupStyle === 'leftMiddle'
      ? theme.messageText.borderRadiusS
      : theme.messageText.borderTopLeftRadius};
  border-top-right-radius: ${({ theme, groupStyle }) =>
    groupStyle === 'rightBottom' || groupStyle === 'rightMiddle'
      ? theme.messageText.borderRadiusS
      : theme.messageText.borderTopRightRadius};
  margin-top: ${({ theme }) => theme.messageText.marginTop};
  padding: ${({ theme }) => theme.messageText.padding}px;
  padding-left: ${({ theme }) => theme.messageText.paddingLeft};
  padding-right: ${({ theme }) => theme.messageText.paddingRight};
  align-self: ${({ theme, alignment }) =>
    alignment === 'left'
      ? theme.messageText.left.alignSelf
      : theme.messageText.right.alignSelf};
  border-width: ${({ theme, alignment }) =>
    alignment === 'left'
      ? theme.messageText.left.borderWidth
      : theme.messageText.right.borderWidth};
  border-color: ${({ theme, alignment }) =>
    alignment === 'left'
      ? theme.messageText.left.borderColor
      : theme.messageText.right.borderColor};
  background-color: ${({ theme, alignment, status }) =>
    alignment === 'left' || status === 'error' || status === 'failed'
      ? theme.messageText.transparent
      : theme.messageText.filled};
`;

export const MessageText = ({ message, isMyMessage = () => false }) => {
  const pos = isMyMessage(message) ? 'right' : 'left';

  const hasAttachment = message.attachments.length > 0 ? true : false;
  const groupStyles =
    (isMyMessage(message) ? 'right' : 'left') +
    capitalize(hasAttachment ? 'bottom' : message.groupPosition[0]);

  if (!message.text) return false;

  return (
    <React.Fragment>
      <TextContainer
        alignment={pos}
        groupStyle={groupStyles}
        status={message.status}
      >
        {renderText(message)}
      </TextContainer>
    </React.Fragment>
  );
};
