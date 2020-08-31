import React from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import Avatar from '../../Avatar/Avatar';

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

const MessageAvatar = ({
  message,
  alignment,
  groupStyles,
  showAvatar = null,
}) => {
  let visible = showAvatar;

  if (visible === null) {
    visible =
      groupStyles[0] === 'single' || groupStyles[0] === 'bottom' ? true : false;
  }

  return (
    <Container alignment={alignment}>
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
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: PropTypes.object,
};

export default MessageAvatar;
