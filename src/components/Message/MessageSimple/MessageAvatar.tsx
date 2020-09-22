import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components/native';

import Avatar from '../../Avatar/Avatar';

const Container = styled.View`
  margin-right: ${({ alignment }) => (alignment === 'left' ? 8 : 0)}px;
  margin-left: ${({ alignment }) => (alignment === 'right' ? 8 : 0)}px;
  ${({ theme }) => theme.message.avatarWrapper.container.css}
`;

const Spacer = styled.View`
  height: 28px;
  width: 32px;
  ${({ theme }) => theme.message.avatarWrapper.spacer.css}
`;

const MessageAvatar = ({ alignment, groupStyles, message, showAvatar }) => {
  const visible =
    typeof showAvatar === 'boolean'
      ? showAvatar
      : groupStyles[0] === 'single' || groupStyles[0] === 'bottom';

  return (
    <Container alignment={alignment} testID='message-avatar'>
      {visible ? (
        <Avatar
          image={message.user.image}
          name={message.user.name || message.user.id}
        />
      ) : (
        <Spacer testID='spacer' />
      )}
    </Container>
  );
};

MessageAvatar.propTypes = {
  /**
   * Avatar alignment: 'left' or 'right'
   */
  alignment: PropTypes.oneOf(['left', 'right']),
  /**
   * Position of message in group - top, bottom, middle, or single
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyles: PropTypes.array,
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: PropTypes.object,
  /**
   * Whether or not to show user avatar
   */
  showAvatar: PropTypes.bool,
};

export default MessageAvatar;
