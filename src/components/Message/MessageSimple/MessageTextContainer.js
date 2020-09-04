import React from 'react';
import PropTypes from 'prop-types';
import styled, { withTheme } from 'styled-components';

import { renderText } from '../../../utils/renderText';
import { capitalize } from '../../../utils/utils';

const TextContainer = styled.View`
  border-bottom-left-radius: ${({ theme, groupStyle }) =>
    groupStyle.indexOf('left') !== -1
      ? theme.message.content.textContainer.borderRadiusS
      : theme.message.content.textContainer.borderRadiusL}px;
  border-bottom-right-radius: ${({ theme, groupStyle }) =>
    groupStyle.indexOf('right') !== -1
      ? theme.message.content.textContainer.borderRadiusS
      : theme.message.content.textContainer.borderRadiusL}px;
  border-top-left-radius: ${({ theme, groupStyle }) =>
    groupStyle === 'leftBottom' || groupStyle === 'leftMiddle'
      ? theme.message.content.textContainer.borderRadiusS
      : theme.message.content.textContainer.borderRadiusL}px;
  border-top-right-radius: ${({ theme, groupStyle }) =>
    groupStyle === 'rightBottom' || groupStyle === 'rightMiddle'
      ? theme.message.content.textContainer.borderRadiusS
      : theme.message.content.textContainer.borderRadiusL}px;
  padding: 5px;
  padding-left: 8px;
  margin-top: 2px;
  padding-right: 8px;
  align-self: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  border-width: ${({ theme, alignment }) =>
    alignment === 'left'
      ? theme.message.content.textContainer.leftBorderWidth
      : theme.message.content.textContainer.rightBorderWidth}px;
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

const MessageTextContainer = withTheme((props) => {
  const {
    message,
    groupStyles = ['bottom'],
    alignment,
    MessageText = false,
  } = props;

  const hasAttachment = message.attachments.length > 0 ? true : false;
  const groupStyle =
    alignment + capitalize(hasAttachment ? 'bottom' : groupStyles[0]);

  if (!message.text) return false;
  const markdownStyles = props.theme
    ? props.theme.message.content.markdown
    : {};
  const markdownRules = props.markdownRules || {};
  return (
    <React.Fragment>
      <TextContainer
        alignment={alignment}
        groupStyle={groupStyle}
        status={message.status}
        type={message.type}
      >
        {!MessageText ? (
          renderText(message, markdownStyles, markdownRules)
        ) : (
          <MessageText {...props} renderText={renderText} />
        )}
      </TextContainer>
    </React.Fragment>
  );
});

MessageTextContainer.propTypes = {
  /**
   * Position of message in group - top, bottom, middle, single.
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyles: PropTypes.array,
  /**
   * Returns true if message (param) belongs to current user, else false
   *
   * @param message
   * */
  isMyMessage: PropTypes.func,
  /** Object specifying rules defined within simple-markdown https://github.com/Khan/simple-markdown#adding-a-simple-extension */
  markdownRules: PropTypes.object,
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: PropTypes.object,
  /** Custom UI component for message text */
  MessageText: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /** Complete theme object. Its a [defaultTheme](https://github.com/GetStream/stream-chat-react-native/blob/master/src/styles/theme.js#L22) merged with customized theme provided as prop to Chat component */
  theme: PropTypes.object,
};

export default MessageTextContainer;
