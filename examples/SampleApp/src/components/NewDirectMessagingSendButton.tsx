import React from 'react';
import { Alert } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/core';

import {
  DefaultStreamChatGenerics,
  MessageInputContextValue,
  Search,
  SendRight,
  SendUp,
  useChannelContext,
  useMessageInputContext,
  useTheme,
} from 'stream-chat-react-native';

import { NewDirectMessagingScreenNavigationProp } from '../screens/NewDirectMessagingScreen';

import { StreamChatGenerics as LocalStreamChatGenerics } from '../types';

type NewDirectMessagingSendButtonPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageInputContextValue<StreamChatGenerics>, 'giphyActive' | 'sendMessage'> & {
  /** Disables the button */ disabled: boolean;
};

const SendButtonWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: NewDirectMessagingSendButtonPropsWithContext<StreamChatGenerics>,
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
      onPress={sendMessage}
      style={[sendButton]}
      testID='send-button'
    >
      {giphyActive && <Search pathFill={accent_blue} />}
      {!giphyActive && disabled && <SendRight fill={grey_gainsboro} size={32} />}
      {!giphyActive && !disabled && <SendUp fill={accent_blue} size={32} />}
    </TouchableOpacity>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: NewDirectMessagingSendButtonPropsWithContext<StreamChatGenerics>,
  nextProps: NewDirectMessagingSendButtonPropsWithContext<StreamChatGenerics>,
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
  if (!disabledEqual) {
    return false;
  }

  const giphyActiveEqual = prevGiphyActive === nextGiphyActive;
  if (!giphyActiveEqual) {
    return false;
  }

  const sendMessageEqual = prevSendMessage === nextSendMessage;
  if (!sendMessageEqual) {
    return false;
  }

  return true;
};

const MemoizedNewDirectMessagingSendButton = React.memo(
  SendButtonWithContext,
  areEqual,
) as typeof SendButtonWithContext;

export type SendButtonProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<NewDirectMessagingSendButtonPropsWithContext<StreamChatGenerics>>;

/**
 * UI Component for send button in MessageInput component.
 */
export const NewDirectMessagingSendButton = (props: SendButtonProps<LocalStreamChatGenerics>) => {
  const navigation = useNavigation<NewDirectMessagingScreenNavigationProp>();
  const { channel } = useChannelContext<LocalStreamChatGenerics>();

  const { giphyActive, text } = useMessageInputContext<LocalStreamChatGenerics>();

  const sendMessage = async () => {
    if (!channel) {
      return;
    }
    channel.initialized = false;
    await channel.query({});
    try {
      await channel.sendMessage({ text });
      navigation.replace('ChannelScreen', {
        channelId: channel.id,
      });
    } catch (e) {
      Alert.alert('Error sending a message');
    }
  };

  return (
    <MemoizedNewDirectMessagingSendButton<LocalStreamChatGenerics>
      {...{ giphyActive, sendMessage }}
      {...props}
      {...{ disabled: props.disabled || false }}
    />
  );
};
