import React from 'react';
import styled from '@stream-io/styled-components';
import iconAddAttachment from '../images/icons/plus-outline.png';
import { themed } from '../styles/theme';
import PropTypes from 'prop-types';

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
 * @example ./docs/AttachButton.md
 */
export const AttachButton = themed(
  class AttachButton extends React.PureComponent {
    static themePath = 'messageInput';
    static propTypes = {
      handleOnPress: PropTypes.func,
      disabled: PropTypes.bool,
    };
    static defaultProps = {
      disabled: false,
    };

    render() {
      const { handleOnPress, disabled } = this.props;
      return (
        <Container onPress={handleOnPress} disabled={disabled}>
          <AttachButtonIcon source={iconAddAttachment} />
        </Container>
      );
    }
  },
);
