import React from 'react';

import type { GestureResponderEvent, ImageRequireSource } from 'react-native';

import { styled } from '../../styles/styledComponents';

const iconAddAttachment: ImageRequireSource = require('../../images/icons/plus-outline.png');

const AttachButtonIcon = styled.Image`
  height: 15px;
  width: 15px;
  ${({ theme }) => theme.messageInput.attachButtonIcon.css};
`;

const Container = styled.TouchableOpacity`
  margin-right: 8px;
  ${({ theme }) => theme.messageInput.attachButton.css};
`;

export type AttachButtonProps = {
  /** Disables the button */
  disabled?: boolean;
  /** Function that opens an attachment action sheet */
  handleOnPress?: (event: GestureResponderEvent) => void;
};

/**
 * UI Component for attach button in MessageInput component.
 *
 * @example ./AttachButton.md
 */
export const AttachButton = ({
  disabled = false,
  handleOnPress,
}: AttachButtonProps) => (
  <Container disabled={disabled} onPress={handleOnPress} testID='attach-button'>
    <AttachButtonIcon source={iconAddAttachment} />
  </Container>
);
