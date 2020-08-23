import React from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import iconAddAttachment from '../../images/icons/plus-outline.png';

import { themed } from '../../styles/theme';

const AttachButtonIcon = styled.Image`
  height: 15px;
  width: 15px;
  ${({ theme }) => theme.messageInput.attachButtonIcon.css}
`;

const Container = styled.TouchableOpacity`
  margin-right: 8px;
  ${({ theme }) => theme.messageInput.attachButton.css}
`;

/**
 * UI Component for attach button in MessageInput component.
 *
 * @example ../docs/AttachButton.md
 */
const AttachButton = ({ disabled = false, handleOnPress }) => (
  <Container disabled={disabled} onPress={handleOnPress} testID='attach-button'>
    <AttachButtonIcon source={iconAddAttachment} />
  </Container>
);

AttachButton.propTypes = {
  disabled: PropTypes.bool,
  handleOnPress: PropTypes.func,
};

AttachButton.themePath = 'messageInput';

export default themed(AttachButton);
