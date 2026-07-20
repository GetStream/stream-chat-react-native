import React, { useCallback } from 'react';

import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { Button } from '../../../ui';

export type EditButtonProps = Partial<Pick<MessageInputContextValue, 'sendMessage'>> & {
  /** Disables the button */
  disabled: boolean;
};

export const EditButton = (props: EditButtonProps) => {
  const { disabled = false, sendMessage: propsSendMessage } = props;
  const { icons } = useComponentsContext();
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
      accessibilityLabelKey='a11y/Save edited message'
      variant='primary'
      type='solid'
      LeadingIcon={icons.Tick}
      iconOnly
      onPress={onPressHandler}
      size='sm'
      disabled={disabled}
      testID='send-button'
    />
  );
};

EditButton.displayName = 'EditButton{messageComposer}';
