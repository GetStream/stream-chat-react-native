import React from 'react';

import type { GestureResponderEvent, ImageRequireSource } from 'react-native';

import { useMessagesContext } from '../../contexts/messagesContext/MessagesContext';
import { styled } from '../../styles/styledComponents';
import { themed } from '../../styles/theme';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

const iconEdit: ImageRequireSource = require('../../images/icons/icon_edit.png');
const iconSendNewMessage: ImageRequireSource = require('../../images/icons/icon_new_message.png');

const Container = styled.TouchableOpacity`
  margin-left: 8px;
  ${({ theme }) => theme.messageInput.sendButton.css};
`;

const SendButtonIcon = styled.Image`
  height: 15px;
  width: 15px;
  ${({ theme }) => theme.messageInput.sendButtonIcon.css};
`;

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
const SendButton = <
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends Record<string, unknown> = DefaultEventType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends Record<string, unknown> = DefaultUserType
>({
  disabled = false,
  sendMessage,
}: SendButtonProps) => {
  const { editing } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
  return (
    <Container disabled={disabled} onPress={sendMessage} testID='send-button'>
      <SendButtonIcon source={editing ? iconEdit : iconSendNewMessage} />
    </Container>
  );
};

SendButton.themePath = 'messageInput';

export default themed(SendButton) as typeof SendButton;
