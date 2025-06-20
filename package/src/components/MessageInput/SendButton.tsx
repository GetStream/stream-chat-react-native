import React, { useCallback } from 'react';

import { Pressable } from 'react-native';

import { TextComposerState } from 'stream-chat';

import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../hooks/useStateStore';
import { Search } from '../../icons/Search';
import { SendRight } from '../../icons/SendRight';
import { SendUp } from '../../icons/SendUp';

export type SendButtonProps = Partial<Pick<MessageInputContextValue, 'sendMessage'>> & {
  /** Disables the button */
  disabled: boolean;
};

const textComposerStateSelector = (state: TextComposerState) => ({
  command: state.command,
});

export const SendButton = (props: SendButtonProps) => {
  const { disabled = false, sendMessage: propsSendMessage } = props;
  const { sendMessage: sendMessageFromContext } = useMessageInputContext();
  const sendMessage = propsSendMessage || sendMessageFromContext;
  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { command } = useStateStore(textComposer.state, textComposerStateSelector);

  const {
    theme: {
      colors: { accent_blue, grey_gainsboro },
      messageInput: { searchIcon, sendButton, sendRightIcon, sendUpIcon },
    },
  } = useTheme();

  const onPressHandler = useCallback(() => {
    if (disabled) {
      return;
    }
    sendMessage();
  }, [disabled, sendMessage]);

  return (
    <Pressable
      disabled={disabled}
      onPress={onPressHandler}
      style={[sendButton]}
      testID='send-button'
    >
      {command ? (
        <Search pathFill={disabled ? grey_gainsboro : accent_blue} {...searchIcon} />
      ) : disabled ? (
        <SendRight fill={grey_gainsboro} size={32} {...sendRightIcon} />
      ) : (
        <SendUp fill={accent_blue} size={32} {...sendUpIcon} />
      )}
    </Pressable>
  );
};

SendButton.displayName = 'SendButton{messageInput}';
