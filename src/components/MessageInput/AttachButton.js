import React from 'react';
import PropTypes from 'prop-types';

import styled from '@stream-io/styled-components';

import iconAddAttachment from '../../images/icons/plus-outline.png';
import { themed } from '../../styles/theme';

const Container = styled.TouchableOpacity`
  margin-right: 8;
  ${({ theme }) => theme.messageInput.attachButton.css}
`;

const AttachButtonIcon = styled.Image`
  width: 15;
  height: 15;
  ${({ theme }) => theme.messageInput.attachButtonIcon.css}
`;

/**
 * UI Component for attach button in MessageInput component.
 *
 * @extends PureComponent
 * @example ../docs/AttachButton.md
 */
class AttachButton extends React.PureComponent {
  static themePath = 'messageInput';
  static propTypes = {
    disabled: PropTypes.bool,
    handleOnPress: PropTypes.func,
  };
  static defaultProps = {
    disabled: false,
  };

  render() {
    const { handleOnPress, disabled } = this.props;
    return (
      <Container disabled={disabled} onPress={handleOnPress}>
        <AttachButtonIcon source={iconAddAttachment} />
      </Container>
    );
  }
}

export default themed(AttachButton);
