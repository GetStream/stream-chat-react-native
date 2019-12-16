import React from 'react';
import styled, { withTheme } from '@stream-io/styled-components';

import { renderText, capitalize } from '../../utils';

const TextContainer = styled.View`
  border-bottom-left-radius: ${({ theme, groupStyle }) =>
    groupStyle.indexOf('left') !== -1
      ? theme.message.content.textContainer.borderRadiusS
      : theme.message.content.textContainer.borderRadiusL};
  border-bottom-right-radius: ${({ theme, groupStyle }) =>
    groupStyle.indexOf('right') !== -1
      ? theme.message.content.textContainer.borderRadiusS
      : theme.message.content.textContainer.borderRadiusL};
  border-top-left-radius: ${({ theme, groupStyle }) =>
    groupStyle === 'leftBottom' || groupStyle === 'leftMiddle'
      ? theme.message.content.textContainer.borderRadiusS
      : theme.message.content.textContainer.borderRadiusL};
  border-top-right-radius: ${({ theme, groupStyle }) =>
    groupStyle === 'rightBottom' || groupStyle === 'rightMiddle'
      ? theme.message.content.textContainer.borderRadiusS
      : theme.message.content.textContainer.borderRadiusL};
  margin-top: 2;
  padding: 5px;
  padding-left: 8;
  padding-right: 8;
  align-self: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  border-width: ${({ theme, alignment }) =>
    alignment === 'left'
      ? theme.message.content.textContainer.leftBorderWidth
      : theme.message.content.textContainer.rightBorderWidth};
  border-color: ${({ theme, alignment }) =>
    alignment === 'left'
      ? theme.message.content.textContainer.leftBorderColor
      : theme.message.content.textContainer.rightBorderColor};
  background-color: ${({ theme, alignment, type, status }) =>
    alignment === 'left' || type === 'error' || status === 'failed'
      ? theme.colors.transparent
      : theme.colors.light};
  ${({ theme }) => theme.message.content.textContainer.css}
`;

export const MessageTextContainer = withTheme((props) => {
  const {
    message,
    groupStyles = ['bottom'],
    isMyMessage = () => false,
    MessageText = false,
  } = props;
  const pos = isMyMessage(message) ? 'right' : 'left';

  const hasAttachment = message.attachments.length > 0 ? true : false;
  const groupStyle =
    (isMyMessage(message) ? 'right' : 'left') +
    capitalize(hasAttachment ? 'bottom' : groupStyles[0]);

  if (!message.text) return false;
  const markdownStyles = props.theme
    ? props.theme.message.content.markdown
    : {};
  return (
    <React.Fragment>
      <TextContainer
        alignment={pos}
        groupStyle={groupStyle}
        status={message.status}
        type={message.type}
      >
        {!MessageText ? (
          renderText(message, markdownStyles)
        ) : (
          <MessageText {...props} renderText={renderText} />
        )}
      </TextContainer>
    </React.Fragment>
  );
});
