import React, { useContext } from 'react';
import styled, { ThemeContext } from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import { capitalize, renderText } from '../../../utils';

const TextContainer = styled.View`
  align-self: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  background-color: ${({ theme, alignment, type, status }) =>
    alignment === 'left' || type === 'error' || status === 'failed'
      ? theme.colors.transparent
      : theme.colors.light};
  border-bottom-left-radius: ${({ theme, groupStyle }) =>
    groupStyle.indexOf('left') !== -1
      ? theme.message.content.textContainer.borderRadiusS
      : theme.message.content.textContainer.borderRadiusL};
  border-bottom-right-radius: ${({ theme, groupStyle }) =>
    groupStyle.indexOf('right') !== -1
      ? theme.message.content.textContainer.borderRadiusS
      : theme.message.content.textContainer.borderRadiusL};
  border-color: ${({ theme, alignment }) =>
    alignment === 'left'
      ? theme.message.content.textContainer.leftBorderColor
      : theme.message.content.textContainer.rightBorderColor};
  border-top-left-radius: ${({ theme, groupStyle }) =>
    groupStyle === 'leftBottom' || groupStyle === 'leftMiddle'
      ? theme.message.content.textContainer.borderRadiusS
      : theme.message.content.textContainer.borderRadiusL};
  border-top-right-radius: ${({ theme, groupStyle }) =>
    groupStyle === 'rightBottom' || groupStyle === 'rightMiddle'
      ? theme.message.content.textContainer.borderRadiusS
      : theme.message.content.textContainer.borderRadiusL};
  border-width: ${({ theme, alignment }) =>
    alignment === 'left'
      ? theme.message.content.textContainer.leftBorderWidth
      : theme.message.content.textContainer.rightBorderWidth};
  margin-top: 2;
  padding: 5px;
  padding-left: 8;
  padding-right: 8;
  ${({ theme }) => theme.message.content.textContainer.css}
`;

const MessageTextContainer = (props) => {
  const {
    alignment,
    groupStyles = ['bottom'],
    markdownRules = {},
    message,
    MessageText,
  } = props;
  const theme = useContext(ThemeContext);

  if (!message.text) return null;

  const groupStyle =
    alignment +
    capitalize(message.attachments.length > 0 ? 'bottom' : groupStyles[0]);
  const markdownStyles = theme ? theme.message.content.markdown : {};

  return (
    <TextContainer
      alignment={alignment}
      groupStyle={groupStyle}
      status={message.status}
      testID='message-text-container'
      type={message.type}
    >
      {MessageText ? (
        <MessageText {...props} renderText={renderText} theme={theme} />
      ) : (
        renderText(message, markdownStyles, markdownRules)
      )}
    </TextContainer>
  );
};

MessageTextContainer.propTypes = {
  /** Position of message. 'right' | 'left' */
  alignment: PropTypes.oneOf(['right', 'left']),
  /**
   * Position of message in group - top, bottom, middle, single.
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyles: PropTypes.array,
  /** Object specifying rules defined within simple-markdown https://github.com/Khan/simple-markdown#adding-a-simple-extension */
  markdownRules: PropTypes.object,
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: PropTypes.object.isRequired,
  /** Custom UI component for message text */
  MessageText: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
};

export default MessageTextContainer;
