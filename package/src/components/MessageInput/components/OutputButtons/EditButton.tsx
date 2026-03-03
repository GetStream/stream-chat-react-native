import React, { useCallback } from 'react';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { Tick } from '../../../../icons/Tick';
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
      variant='primary'
      type='solid'
      LeadingIcon={Tick}
      iconOnly
      onPress={onPressHandler}
      size='sm'
      disabled={disabled}
      testID='send-button'
    />
  );
};

EditButton.displayName = 'EditButton{messageInput}';
