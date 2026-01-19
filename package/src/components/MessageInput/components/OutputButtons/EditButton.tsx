import React, { useCallback } from 'react';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { NewTick } from '../../../../icons/NewTick';
import { IconButton } from '../../../ui/IconButton';

export type EditButtonProps = Partial<Pick<MessageInputContextValue, 'sendMessage'>> & {
  /** Disables the button */
  disabled: boolean;
};

export const EditButton = (props: EditButtonProps) => {
  const { disabled = false, sendMessage: propsSendMessage } = props;
  const { sendMessage: sendMessageFromContext } = useMessageInputContext();
  const sendMessage = propsSendMessage || sendMessageFromContext;

  const {
    theme: {
      messageInput: { editButton },
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
      Icon={NewTick}
      iconColor='white'
      onPress={onPressHandler}
      size='sm'
      status={disabled ? 'disabled' : 'enabled'}
      style={editButton}
      testID='send-button'
    />
  );
};

EditButton.displayName = 'EditButton{messageInput}';
