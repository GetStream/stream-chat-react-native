import React, { useCallback } from 'react';

import { Pressable } from 'react-native';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Search } from '../../icons/Search';
import { SendRight } from '../../icons/SendRight';
import { SendUp } from '../../icons/SendUp';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { useChannelContext } from '../../contexts';
import { AIStates, AIStatesEnum, useAIState } from '../AITypingIndicatorView';
import { EventAPIResponse } from 'stream-chat';

type SendButtonPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageInputContextValue<StreamChatGenerics>, 'giphyActive' | 'sendMessage'> & {
  /** Disables the button */ disabled: boolean;
  aiState: AIStatesEnum;
  stopGenerating: () => Promise<EventAPIResponse<StreamChatGenerics>>;
};

const SendButtonWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: SendButtonPropsWithContext<StreamChatGenerics>,
) => {
  const { disabled = false, giphyActive, sendMessage, aiState, stopGenerating } = props;
  const {
    theme: {
      colors: { accent_blue, grey_gainsboro },
      messageInput: { searchIcon, sendButton, sendRightIcon, sendUpIcon },
    },
  } = useTheme();

  const shouldDisplayStopAIGeneration = [AIStates.Thinking, AIStates.Generating].includes(aiState);

  return (
    <Pressable
      disabled={disabled}
      onPress={disabled ? () => null : shouldDisplayStopAIGeneration ? () => stopGenerating() : () => sendMessage()}
      style={[sendButton]}
      testID='send-button'
    >
      {giphyActive || shouldDisplayStopAIGeneration ? ( // TODO: Fix the icon please.
        <Search pathFill={disabled ? grey_gainsboro : accent_blue} {...searchIcon} />
      ) : disabled ? (
        <SendRight fill={grey_gainsboro} size={32} {...sendRightIcon} />
      ) : (
        <SendUp fill={accent_blue} size={32} {...sendUpIcon} />
      )}
    </Pressable>
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
    aiState: prevAiState,
  } = prevProps;
  const {
    disabled: nextDisabled,
    giphyActive: nextGiphyActive,
    sendMessage: nextSendMessage,
    aiState: nextAiState,
  } = nextProps;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  const giphyActiveEqual = prevGiphyActive === nextGiphyActive;
  if (!giphyActiveEqual) return false;

  const sendMessageEqual = prevSendMessage === nextSendMessage;
  if (!sendMessageEqual) return false;

  const aiStateEqual = prevAiState === nextAiState;
  if (!aiStateEqual) return false;

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
  const { giphyActive, sendMessage } = useMessageInputContext<StreamChatGenerics>();
  const { channel } = useChannelContext<StreamChatGenerics>();
  const { aiState } = useAIState(channel);

  const stopGenerating = useCallback(() => channel.sendEvent({ type: 'stop_generating', cid: channel.cid }), [channel])

  return (
    <MemoizedSendButton
      {...{ giphyActive, sendMessage }}
      {...props}
      {...{ disabled: props.disabled || false }}
      aiState={aiState}
      stopGenerating={stopGenerating}
    />
  );
};

SendButton.displayName = 'SendButton{messageInput}';
