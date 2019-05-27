import React from 'react';
import styled from '@stream-io/styled-components';

import { MessageStatus } from './MessageStatus';
import { MessageContent } from './MessageContent';
import { MessageAvatar } from './MessageAvatar';

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
`;

export class MessageSimple extends React.PureComponent {
  render() {
    const { message, isMyMessage } = this.props;
    const pos = isMyMessage(message) ? 'right' : 'left';
    const marginBottom =
      message.groupPosition[0] === 'single' ||
      message.groupPosition[0] === 'bottom'
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
}

export { MessageStatus } from './MessageStatus';
export { MessageContent } from './MessageContent';
export { MessageAvatar } from './MessageAvatar';
export { MessageText } from './MessageText';
