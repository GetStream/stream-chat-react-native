import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { SendRight, SendUp } from '../../icons';

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

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    marginLeft: 8,
  },
});

type SendButtonPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<
  MessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  'sendMessage'
> & {
  /** Disables the button */ disabled: boolean;
};

const SendButtonWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: SendButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { disabled = false, sendMessage } = props;
  const {
    theme: {
      messageInput: { sendButton },
    },
  } = useTheme();

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={sendMessage}
      style={[styles.container, sendButton]}
      testID='send-button'
    >
      {disabled && <SendRight height={24} width={24} />}
      {!disabled && <SendUp height={24} width={24} />}
    </TouchableOpacity>
  );
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: SendButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: SendButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { disabled: prevDisabled, sendMessage: prevSendMessage } = prevProps;
  const { disabled: nextDisabled, sendMessage: nextSendMessage } = nextProps;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  const sendMessageEqual = prevSendMessage === nextSendMessage;
  if (!sendMessageEqual) return false;

  return true;
};

const MemoizedSendButton = React.memo(
  SendButtonWithContext,
  areEqual,
) as typeof SendButtonWithContext;

export type SendButtonProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<SendButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

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
  props: SendButtonProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { sendMessage } = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us>();

  return (
    <MemoizedSendButton
      {...{ sendMessage }}
      {...props}
      {...{ disabled: props.disabled || false }}
    />
  );
};

SendButton.displayName = 'SendButton{messageInput}';
