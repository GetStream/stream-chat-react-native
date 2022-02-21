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

import type { DefaultStreamChatGenerics } from '../../types/types';

type SendButtonPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageInputContextValue<StreamChatGenerics>, 'giphyActive' | 'sendMessage'> & {
  /** Disables the button */ disabled: boolean;
};

const SendButtonWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: SendButtonPropsWithContext<StreamChatGenerics>,
) => {
  const { disabled = false, giphyActive, sendMessage } = props;
  const {
    theme: {
      colors: { accent_blue, grey_gainsboro },
      messageInput: { sendButton },
    },
  } = useTheme('SendButton');

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

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: SendButtonPropsWithContext<StreamChatGenerics>,
  nextProps: SendButtonPropsWithContext<StreamChatGenerics>,
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

export type SendButtonProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<SendButtonPropsWithContext<StreamChatGenerics>>;

/**
 * UI Component for send button in MessageInput component.
 */
export const SendButton = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: SendButtonProps<StreamChatGenerics>,
) => {
  const { giphyActive, sendMessage } = useMessageInputContext<StreamChatGenerics>('SendButton');

  return (
    <MemoizedSendButton
      {...{ giphyActive, sendMessage }}
      {...props}
      {...{ disabled: props.disabled || false }}
    />
  );
};

SendButton.displayName = 'SendButton{messageInput}';
