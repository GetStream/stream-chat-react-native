import React from 'react';
import styled from '@stream-io/styled-components';

import { renderText, capitalize } from '../../utils';

const TextContainer = styled.View`
  border-bottom-left-radius: ${({ theme, groupStyle }) =>
    groupStyle.indexOf('left') !== -1
      ? theme.messageText.borderRadiusS
      : theme.messageText.borderRadiusL};
  border-bottom-right-radius: ${({ theme, groupStyle }) =>
    groupStyle.indexOf('right') !== -1
      ? theme.messageText.borderRadiusS
      : theme.messageText.borderRadiusL};
  border-top-left-radius: ${({ theme, groupStyle }) =>
    groupStyle === 'leftBottom' || groupStyle === 'leftMiddle'
      ? theme.messageText.borderRadiusS
      : theme.messageText.borderRadiusL};
  border-top-right-radius: ${({ theme, groupStyle }) =>
    groupStyle === 'rightBottom' || groupStyle === 'rightMiddle'
      ? theme.messageText.borderRadiusS
      : theme.messageText.borderRadiusL};
  margin-top: 2;
  padding: 5px;
  padding-left: 8;
  padding-right: 8;
  align-self: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  border-width: ${({ theme, alignment }) =>
    alignment === 'left'
      ? theme.messageText.leftBorderWidth
      : theme.messageText.rightBorderWidth};
  border-color: ${({ theme, alignment }) =>
    alignment === 'left'
      ? theme.messageText.leftBorderColor
      : theme.messageText.rightBorderColor};
  background-color: ${({ theme, alignment, status }) =>
    alignment === 'left' || status === 'error' || status === 'failed'
      ? theme.colors.transparent
      : theme.colors.light};
  ${({ theme }) => theme.messageText.extra}
`;

export const MessageText = ({
  message,
  groupStyles,
  isMyMessage = () => false,
}) => {
  const pos = isMyMessage(message) ? 'right' : 'left';

  const hasAttachment = message.attachments.length > 0 ? true : false;
  const groupStyle =
    (isMyMessage(message) ? 'right' : 'left') +
    capitalize(hasAttachment ? 'bottom' : groupStyles[0]);

  if (!message.text) return false;

  return (
    <React.Fragment>
      <TextContainer
        alignment={pos}
        groupStyle={groupStyle}
        status={message.status}
      >
        {renderText(message)}
      </TextContainer>
    </React.Fragment>
  );
};
