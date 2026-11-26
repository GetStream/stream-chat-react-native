import React, { useCallback } from 'react';

import { useChannelContext } from '../../../../contexts/channelContext/ChannelContext';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { Button } from '../../../ui';

export type SendButtonProps = Partial<Pick<MessageInputContextValue, 'sendMessage'>> & {
  /** Disables the button */
  disabled: boolean;
};

export const SendButton = (props: SendButtonProps) => {
  const { disabled = false, sendMessage: propsSendMessage } = props;
  const { icons } = useComponentsContext();
  const { openScheduleSheet, sendMessage: sendMessageFromContext } = useMessageInputContext();
  const sendMessage = propsSendMessage || sendMessageFromContext;
  const { channel } = useChannelContext();
  const canSchedule = !disabled && channel?.scheduledMessagesEnabled;

  const onPressHandler = useCallback(() => {
    if (disabled) {
      return;
    }
    sendMessage();
  }, [disabled, sendMessage]);

  return (
    <Button
      accessibilityLabelKey='messageInput.sendMessage.accessibilityLabel'
      variant='primary'
      type='solid'
      disabled={disabled}
      LeadingIcon={icons.SendRight}
      onLongPress={canSchedule ? openScheduleSheet : undefined}
      onPress={onPressHandler}
      size='sm'
      testID='send-button'
      iconOnly
    />
  );
};

SendButton.displayName = 'SendButton{messageComposer}';
