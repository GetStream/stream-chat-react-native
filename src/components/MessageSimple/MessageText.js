import React from 'react';
import styled from '@stream-io/styled-components';

import { renderText, capitalize } from '../../utils';

const TextContainer = styled.View`
  border-bottom-left-radius: ${(props) =>
    props.groupStyle.indexOf('left') !== -1
      ? props.theme.messageText.borderRadiusS
      : props.theme.messageText.borderBottomLeftRadius};
  border-bottom-right-radius: ${(props) =>
    props.groupStyle.indexOf('right') !== -1
      ? props.theme.messageText.borderRadiusS
      : props.theme.messageText.borderBottomRightRadius};
  border-top-left-radius: ${(props) =>
    props.groupStyle === 'leftBottom' || props.groupStyle === 'leftMiddle'
      ? props.theme.messageText.borderRadiusS
      : props.theme.messageText.borderTopLeftRadius};
  border-top-right-radius: ${(props) =>
    props.groupStyle === 'rightBottom' || props.groupStyle === 'rightMiddle'
      ? props.theme.messageText.borderRadiusS
      : props.theme.messageText.borderTopRightRadius};
  margin-top: ${(props) => props.theme.messageText.marginTop};
  padding: ${(props) => props.theme.messageText.padding}px;
  padding-left: ${(props) => props.theme.messageText.paddingLeft};
  padding-right: ${(props) => props.theme.messageText.paddingRight};
  align-self: ${(props) =>
    props.alignment === 'left'
      ? props.theme.messageText.left.alignSelf
      : props.theme.messageText.right.alignSelf};
  border-width: ${(props) =>
    props.alignment === 'left'
      ? props.theme.messageText.left.borderWidth
      : props.theme.messageText.right.borderWidth};
  border-color: ${(props) =>
    props.alignment === 'left'
      ? props.theme.messageText.left.borderColor
      : props.theme.messageText.right.borderColor};
  background-color: ${(props) =>
    props.alignment === 'left' ||
    props.status === 'error' ||
    props.status === 'failed'
      ? props.theme.messageText.transparent
      : props.theme.messageText.filled};
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
