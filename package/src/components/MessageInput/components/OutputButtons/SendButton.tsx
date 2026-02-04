import React, { useCallback } from 'react';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { SendRight } from '../../../../icons/SendRight';
import { Button } from '../../../ui';

export type SendButtonProps = Partial<Pick<MessageInputContextValue, 'sendMessage'>> & {
  /** Disables the button */
  disabled: boolean;
};

export const SendButton = (props: SendButtonProps) => {
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
      variant='primary'
      type='solid'
      disabled={disabled}
      LeadingIcon={SendRight}
      onPress={onPressHandler}
      size='sm'
      testID='send-button'
      iconOnly
    />
  );
};

SendButton.displayName = 'SendButton{messageInput}';
