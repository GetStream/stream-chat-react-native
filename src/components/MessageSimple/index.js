import React from 'react';
import styled from '@stream-io/styled-components';
import { themed } from '../../styles/theme';

import { MessageStatus } from './MessageStatus';
import { MessageContent } from './MessageContent';
import { MessageAvatar } from './MessageAvatar';
import PropTypes from 'prop-types';

const Container = styled.View`
  display: ${({ theme }) => theme.messageSimple.container.display};
  flex-direction: ${({ theme }) => theme.messageSimple.container.flexDirection};
  align-items: ${({ theme }) => theme.messageSimple.container.alignItems};
  justify-content: ${({ theme, alignment }) =>
    alignment === 'left'
      ? theme.messageSimple.container.left.justifyContent
      : theme.messageSimple.container.right.justifyContent};
  margin-bottom: ${({ theme, marginBottom }) =>
    marginBottom ? theme.messageSimple.container.marginBottom : 0};
  ${({ theme }) => theme.messageSimple.container.extra}
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
      const marginBottom =
        groupStyles[0] === 'single' || groupStyles[0] === 'bottom'
          ? true
          : false;

      return (
        <Container alignment={pos} marginBottom={marginBottom}>
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
