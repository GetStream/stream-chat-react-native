import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { GestureResponderEvent } from 'react-native';

import { SendRight, SendUp } from '../../icons';

const styles = StyleSheet.create({
  container: {
    marginLeft: 8,
  },
  sendButtonIcon: {
    height: 15,
    width: 15,
  },
});

export type SendButtonProps = {
  /** Disables the button */
  disabled?: boolean;
  /** Function that sends message */
  sendMessage?: (event?: GestureResponderEvent) => void;
};

/**
 * UI Component for send button in MessageInput component.
 *
 * @example ./SendButton.md
 */
export const SendButton = (props: SendButtonProps) => {
  const { disabled = false, sendMessage } = props;
  const {
    theme: {
      messageInput: { sendButton },
    },
  } = useTheme();

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={sendMessage}
      style={[styles.container, sendButton]}
      testID='send-button'
    >
      {disabled && <SendRight height={24} width={24} />}
      {!disabled && <SendUp height={24} width={24} />}
    </TouchableOpacity>
  );
};

SendButton.displayName = 'SendButton{messageInput}';
