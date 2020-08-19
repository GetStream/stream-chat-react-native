import React from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import { Avatar } from '../../Avatar';

const Container = styled.View`
  margin-right: ${({ alignment }) => (alignment === 'left' ? 8 : 0)};
  margin-left: ${({ alignment }) => (alignment === 'right' ? 8 : 0)};
  ${({ theme }) => theme.message.avatarWrapper.container.css}
`;

const Spacer = styled.View`
  width: 32;
  height: 28;
  ${({ theme }) => theme.message.avatarWrapper.spacer.css}
`;

const MessageAvatar = ({ alignment, groupStyles, message, showAvatar }) => {
  const visible =
    showAvatar != null
      ? showAvatar
      : groupStyles[0] === 'single' || groupStyles[0] === 'bottom'
      ? true
      : false;

  return (
    <Container alignment={alignment} testID='message-avatar'>
      {visible ? (
        <Avatar
          image={message.user.image}
          name={message.user.name || message.user.id}
        />
      ) : (
        <Spacer />
      )}
    </Container>
  );
};

MessageAvatar.propTypes = {
  /**
   * Avatar alignment 'left' or 'right'.
   */
  alignment: PropTypes.string,
  /**
   * Position of message in group - top, bottom, middle, single.
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyles: PropTypes.array,
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: PropTypes.object,
  /**
   * Should show avatar.
   */
  showAvatar: PropTypes.bool,
};

export default MessageAvatar;
