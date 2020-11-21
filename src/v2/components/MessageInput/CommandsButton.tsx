import React from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Lightning } from '../../icons';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    marginRight: 8,
  },
});

export type CommandsButtonProps = {
  /** Disables the button */
  disabled?: boolean;
  /** Function that opens an attachment action sheet */
  handleOnPress?: (event: GestureResponderEvent) => void;
};

/**
 * UI Component for attach button in MessageInput component.
 *
 * @example ./CommandsButton.md
 */
export const CommandsButton: React.FC<CommandsButtonProps> = (props) => {
  const { disabled = false, handleOnPress } = props;
  const {
    theme: {
      messageInput: { commandsButton },
    },
  } = useTheme();

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={handleOnPress}
      style={[styles.container, commandsButton]}
      testID='attach-button'
    >
      <Lightning height={24} width={24} />
    </TouchableOpacity>
  );
};

CommandsButton.displayName = 'CommandsButton{messageInput}';
