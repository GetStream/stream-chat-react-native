import React, { useCallback } from 'react';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { SendRight } from '../../../../icons/SendRight';
import { IconButton } from '../../../ui/IconButton';

export type SendButtonProps = Partial<Pick<MessageInputContextValue, 'sendMessage'>> & {
  /** Disables the button */
  disabled: boolean;
};

export const SendButton = (props: SendButtonProps) => {
  const { disabled = false, sendMessage: propsSendMessage } = props;
  const { sendMessage: sendMessageFromContext } = useMessageInputContext();
  const sendMessage = propsSendMessage || sendMessageFromContext;

  const {
    theme: {
      messageInput: { sendButton },
    },
  } = useTheme();

  const onPressHandler = useCallback(() => {
    if (disabled) {
      return;
    }
    sendMessage();
  }, [disabled, sendMessage]);

  return (
    <IconButton
      disabled={disabled}
      Icon={SendRight}
      iconColor='white'
      onPress={onPressHandler}
      size='sm'
      style={sendButton}
      testID='send-button'
    />
  );
};

SendButton.displayName = 'SendButton{messageInput}';
