import React, { useCallback } from 'react';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { NewTick } from '../../../../icons/NewTick';
import { Button } from '../../../ui';

export type EditButtonProps = Partial<Pick<MessageInputContextValue, 'sendMessage'>> & {
  /** Disables the button */
  disabled: boolean;
};

export const EditButton = (props: EditButtonProps) => {
  const { disabled = false, sendMessage: propsSendMessage } = props;
  const { sendMessage: sendMessageFromContext } = useMessageInputContext();
  const sendMessage = propsSendMessage || sendMessageFromContext;

  const onPressHandler = useCallback(() => {
    if (disabled) {
      return;
    }
    sendMessage();
  }, [disabled, sendMessage]);

  return (
    <Button
      buttonStyle='primary'
      type='solid'
      LeadingIcon={NewTick}
      iconOnly
      onPress={onPressHandler}
      size='sm'
      state={disabled ? 'disabled' : 'default'}
      testID='send-button'
    />
  );
};

EditButton.displayName = 'EditButton{messageInput}';
