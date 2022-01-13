import React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Search } from '../../icons/Search';
import { SendRight } from '../../icons/SendRight';
import { SendUp } from '../../icons/SendUp';

import type { StreamChatGenerics } from '../../types/types';

type SendButtonPropsWithContext<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Pick<MessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'giphyActive' | 'sendMessage'> & {
  /** Disables the button */ disabled: boolean;
};

const SendButtonWithContext = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: SendButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { disabled = false, giphyActive, sendMessage } = props;
  const {
    theme: {
      colors: { accent_blue, grey_gainsboro },
      messageInput: { sendButton },
    },
  } = useTheme();

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={disabled ? () => null : sendMessage}
      style={[sendButton]}
      testID='send-button'
    >
      {giphyActive && <Search pathFill={accent_blue} />}
      {!giphyActive && disabled && <SendRight pathFill={grey_gainsboro} />}
      {!giphyActive && !disabled && <SendUp pathFill={accent_blue} />}
    </TouchableOpacity>
  );
};

const areEqual = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: SendButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: SendButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    disabled: prevDisabled,
    giphyActive: prevGiphyActive,
    sendMessage: prevSendMessage,
  } = prevProps;
  const {
    disabled: nextDisabled,
    giphyActive: nextGiphyActive,
    sendMessage: nextSendMessage,
  } = nextProps;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  const giphyActiveEqual = prevGiphyActive === nextGiphyActive;
  if (!giphyActiveEqual) return false;

  const sendMessageEqual = prevSendMessage === nextSendMessage;
  if (!sendMessageEqual) return false;

  return true;
};

const MemoizedSendButton = React.memo(
  SendButtonWithContext,
  areEqual,
) as typeof SendButtonWithContext;

export type SendButtonProps<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Partial<SendButtonPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

/**
 * UI Component for send button in MessageInput component.
 */
export const SendButton = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: SendButtonProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { giphyActive, sendMessage } = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us>();

  return (
    <MemoizedSendButton
      {...{ giphyActive, sendMessage }}
      {...props}
      {...{ disabled: props.disabled || false }}
    />
  );
};

SendButton.displayName = 'SendButton{messageInput}';
