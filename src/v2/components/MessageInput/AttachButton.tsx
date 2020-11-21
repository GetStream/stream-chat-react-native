import React from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Attach } from '../../icons';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
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
      messageInput: { attachButton },
    },
  } = useTheme();

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={handleOnPress}
      style={[styles.container, attachButton]}
      testID='attach-button'
    >
      <Attach height={24} width={24} />
    </TouchableOpacity>
  );
};

AttachButton.displayName = 'AttachButton{messageInput}';
