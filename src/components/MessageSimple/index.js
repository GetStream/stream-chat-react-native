import React from 'react';
import styled from '@stream-io/styled-components';
import { themed } from '../../styles/theme';

import { MessageStatus } from './MessageStatus';
import { MessageContent } from './MessageContent';
import { MessageAvatar } from './MessageAvatar';

const Container = styled.View`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  margin-bottom: ${({ marginBottom }) => (marginBottom ? 20 : 0)};
  ${({ theme }) => theme.message.container.extra}
`;

export const MessageSimple = themed(
  class MessageSimple extends React.PureComponent {
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
