import React from 'react';

import { Pressable } from 'react-native';

import { CustomDataManagerState } from 'stream-chat';

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

type SendButtonPropsWithContext = Pick<MessageInputContextValue, 'sendMessage'> & {
  /** Disables the button */ disabled: boolean;
};

const customComposerDataSelector = (state: CustomDataManagerState) => ({
  command: state.custom.command,
});

const SendButtonWithContext = (props: SendButtonPropsWithContext) => {
  const { disabled = false, sendMessage } = props;
  const messageComposer = useMessageComposer();
  const { customDataManager } = messageComposer;
  const { command } = useStateStore(customDataManager.state, customComposerDataSelector);
  const {
    theme: {
      colors: { accent_blue, grey_gainsboro },
      messageInput: { searchIcon, sendButton, sendRightIcon, sendUpIcon },
    },
  } = useTheme();

  return (
    <Pressable
      disabled={disabled}
      onPress={disabled ? () => null : () => sendMessage()}
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

const areEqual = (prevProps: SendButtonPropsWithContext, nextProps: SendButtonPropsWithContext) => {
  const { disabled: prevDisabled, sendMessage: prevSendMessage } = prevProps;
  const { disabled: nextDisabled, sendMessage: nextSendMessage } = nextProps;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) {
    return false;
  }

  const sendMessageEqual = prevSendMessage === nextSendMessage;
  if (!sendMessageEqual) {
    return false;
  }

  return true;
};

const MemoizedSendButton = React.memo(
  SendButtonWithContext,
  areEqual,
) as typeof SendButtonWithContext;

export type SendButtonProps = Partial<SendButtonPropsWithContext>;

/**
 * UI Component for send button in MessageInput component.
 */
export const SendButton = (props: SendButtonProps) => {
  const { sendMessage } = useMessageInputContext();

  return (
    <MemoizedSendButton
      {...{ sendMessage }}
      {...props}
      {...{ disabled: props.disabled || false }}
    />
  );
};

SendButton.displayName = 'SendButton{messageInput}';
