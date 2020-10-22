import React from 'react';
import {
  GestureResponderEvent,
  Image,
  ImageRequireSource,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

const iconAddAttachment: ImageRequireSource = require('../../../images/icons/plus-outline.png');

const styles = StyleSheet.create({
  attachButtonIcon: {
    height: 15,
    width: 15,
  },
  container: {
    marginRight: 8,
  },
});

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
export const AttachButton: React.FC<AttachButtonProps> = (props) => {
  const { disabled = false, handleOnPress } = props;
  const {
    theme: {
      messageInput: { attachButton, attachButtonIcon },
    },
  } = useTheme();

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={handleOnPress}
      style={[styles.container, attachButton]}
      testID='attach-button'
    >
      <Image
        source={iconAddAttachment}
        style={[styles.attachButtonIcon, attachButtonIcon]}
      />
    </TouchableOpacity>
  );
};

AttachButton.displayName = 'AttachButton{messageInput}';
