import React from 'react';
import styled from '@stream-io/styled-components';
import { getTheme } from '../../styles/theme';

import { MessageStatus } from './MessageStatus';
import { MessageContent } from './MessageContent';
import { MessageAvatar } from './MessageAvatar';

const Container = styled.View`
  display: ${(props) => getTheme(props).messageSimple.container.display};
  flex-direction: ${(props) =>
    getTheme(props).messageSimple.container.flexDirection};
  align-items: ${(props) => getTheme(props).messageSimple.container.alignItems};
  justify-content: ${(props) =>
    props.position === 'left'
      ? getTheme(props).messageSimple.container.left.justifyContent
      : getTheme(props).messageSimple.container.right.justifyContent};
  margin-bottom: ${(props) =>
    props.bottom ? getTheme(props).messageSimple.container.marginBottom : 0};
`;

export class MessageSimple extends React.PureComponent {
  render() {
    const { message, isMyMessage } = this.props;
    const pos = isMyMessage(message) ? 'right' : 'left';
    const bottomMargin =
      message.groupPosition[0] === 'single' ||
      message.groupPosition[0] === 'bottom'
        ? true
        : false;
    return (
      <Container position={pos} bottom={bottomMargin}>
        {isMyMessage(message) ? (
          <React.Fragment>
            <MessageContent {...this.props} position={pos} />
            <MessageAvatar {...this.props} />
            <MessageStatus {...this.props} />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <MessageAvatar {...this.props} />
            <MessageContent {...this.props} position={pos} />
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
