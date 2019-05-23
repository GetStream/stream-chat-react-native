import React from 'react';
import styled from 'styled-components';

import { renderText, capitalize } from '../../utils';
import { getTheme } from '../styles/theme';

const TextContainer = styled.View`
  border-bottom-left-radius: ${(props) =>
    props.groupStyle.indexOf('left') !== -1
      ? getTheme(props).messageText.borderRadiusS
      : getTheme(props).messageText.borderBottomLeftRadius};
  border-bottom-right-radius: ${(props) =>
    props.groupStyle.indexOf('right') !== -1
      ? getTheme(props).messageText.borderRadiusS
      : getTheme(props).messageText.borderBottomRightRadius};
  border-top-left-radius: ${(props) =>
    props.groupStyle === 'leftBottom' || props.groupStyle === 'leftMiddle'
      ? getTheme(props).messageText.borderRadiusS
      : getTheme(props).messageText.borderTopLeftRadius};
  border-top-right-radius: ${(props) =>
    props.groupStyle === 'rightBottom' || props.groupStyle === 'rightMiddle'
      ? getTheme(props).messageText.borderRadiusS
      : getTheme(props).messageText.borderTopRightRadius};
  margin-top: ${(props) => getTheme(props).messageText.marginTop};
  padding: ${(props) => getTheme(props).messageText.padding}px;
  padding-left: ${(props) => getTheme(props).messageText.paddingLeft};
  padding-right: ${(props) => getTheme(props).messageText.paddingRight};
  align-self: ${(props) =>
    props.position === 'left'
      ? getTheme(props).messageText.left.alignSelf
      : getTheme(props).messageText.right.alignSelf};
  border-width: ${(props) =>
    props.position === 'left'
      ? getTheme(props).messageText.left.borderWidth
      : getTheme(props).messageText.right.borderWidth};
  border-color: ${(props) =>
    props.position === 'left'
      ? getTheme(props).messageText.left.borderColor
      : getTheme(props).messageText.right.borderColor};
  background-color: ${(props) =>
    props.position === 'left' ||
    props.status === 'error' ||
    props.status === 'failed'
      ? getTheme(props).messageText.transparent
      : getTheme(props).messageText.filled};
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
        position={pos}
        groupStyle={groupStyles}
        status={message.status}
      >
        {renderText(message)}
      </TextContainer>
    </React.Fragment>
  );
};
