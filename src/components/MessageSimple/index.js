import React from 'react';
import styled from 'styled-components';
import { getTheme } from '../../styles/theme';

import { MessageStatus } from './MessageStatus';
import { MessageContent } from './MessageContent';
import { MessageAvatar } from './MessageAvatar';
import PropTypes from 'prop-types';

const Container = styled.View`
  display: ${(props) => getTheme(props).messageSimple.container.display};
  flex-direction: ${(props) =>
    getTheme(props).messageSimple.container.flexDirection};
  align-items: ${(props) => getTheme(props).messageSimple.container.alignItems};
  justify-content: ${(props) =>
    props.alignment === 'left'
      ? getTheme(props).messageSimple.container.left.justifyContent
      : getTheme(props).messageSimple.container.right.justifyContent};
  margin-bottom: ${(props) =>
    props.marginBottom
      ? getTheme(props).messageSimple.container.marginBottom
      : 0};
`;

export class MessageSimple extends React.PureComponent {
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
