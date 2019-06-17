import React from 'react';
import styled from '@stream-io/styled-components';
import { themed } from '../../styles/theme';

import { MessageStatus } from './MessageStatus';
import { MessageContent } from './MessageContent';
import { MessageAvatar } from './MessageAvatar';
import PropTypes from 'prop-types';

const Container = styled.View`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  margin-bottom: ${({ hasMarginBottom, isVeryLastMessage }) =>
    hasMarginBottom ? (isVeryLastMessage ? 30 : 20) : 0};
  ${({ theme }) => theme.message.container.css}
`;

export const MessageSimple = themed(
  class MessageSimple extends React.PureComponent {
    static propTypes = {
      /** enabled reactions, this is usually set by the parent component based on channel configs */
      reactionsEnabled: PropTypes.bool.isRequired,
      /** enabled replies, this is usually set by the parent component based on channel configs */
      repliesEnabled: PropTypes.bool.isRequired,
    };

    static defaultProps = {
      reactionsEnabled: true,
      repliesEnabled: true,
    };

    static themePath = 'messageSimple';

    render() {
      const { message, isMyMessage, groupStyles } = this.props;
      const pos = isMyMessage(message) ? 'right' : 'left';
      const lastMessage = this.props.channel.state.messages[
        this.props.channel.state.messages.length - 1
      ];
      const isVeryLastMessage = lastMessage
        ? lastMessage.id === message.id
        : false;
      const hasMarginBottom =
        groupStyles[0] === 'single' || groupStyles[0] === 'bottom'
          ? true
          : false;

      return (
        <Container
          alignment={pos}
          hasMarginBottom={hasMarginBottom}
          isVeryLastMessage={isVeryLastMessage}
        >
          {isMyMessage(message) ? (
            <React.Fragment>
              <MessageContent {...this.props} alignment={pos} />
              <MessageAvatar {...this.props} />
              <MessageStatus {...this.props} />
            </React.Fragment>
          ) : (
            <React.Fragment>
              <MessageAvatar {...this.props} />
              <MessageContent {...this.props} alignment={pos} />
            </React.Fragment>
          )}
        </Container>
      );
    }
  },
);

export { MessageStatus } from './MessageStatus';
export { MessageContent } from './MessageContent';
export { MessageAvatar } from './MessageAvatar';
export { MessageText } from './MessageText';
