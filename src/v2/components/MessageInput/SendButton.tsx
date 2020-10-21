import React from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';

import { useMessagesContext } from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { GestureResponderEvent, ImageRequireSource } from 'react-native';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const iconEdit: ImageRequireSource = require('../../../images/icons/icon_edit.png');
const iconSendNewMessage: ImageRequireSource = require('../../../images/icons/icon_new_message.png');

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
  sendMessage?: (event: GestureResponderEvent) => void;
};

/**
 * UI Component for send button in MessageInput component.
 *
 * @example ./SendButton.md
 */
export const SendButton = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: SendButtonProps,
) => {
  const { disabled = false, sendMessage } = props;
  const { editing } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    theme: {
      messageInput: { sendButton, sendButtonIcon },
    },
  } = useTheme();

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={sendMessage}
      style={[styles.container, sendButton]}
      testID='send-button'
    >
      <Image
        source={editing ? iconEdit : iconSendNewMessage}
        style={[styles.sendButtonIcon, sendButtonIcon]}
      />
    </TouchableOpacity>
  );
};

SendButton.displayName = 'SendButton{messageInput}';
