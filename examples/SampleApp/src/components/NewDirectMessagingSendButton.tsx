import React from 'react';
import { Alert } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/core';

import {
  MessageInputContextValue,
  Search,
  SendRight,
  SendUp,
  useChannelContext,
  useMessageInputContext,
  useTheme,
} from 'stream-chat-react-native';

import { NewDirectMessagingScreenNavigationProp } from '../screens/NewDirectMessagingScreen';

import { useUserSearchContext } from '../context/UserSearchContext';
import { useAppContext } from '../context/AppContext';

type NewDirectMessagingSendButtonPropsWithContext = Pick<MessageInputContextValue, 'giphyActive' | 'sendMessage'> & {
  /** Disables the button */ disabled: boolean;
};

const SendButtonWithContext = (
  props: NewDirectMessagingSendButtonPropsWithContext,
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

const areEqual = (
  prevProps: NewDirectMessagingSendButtonPropsWithContext,
  nextProps: NewDirectMessagingSendButtonPropsWithContext,
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

export type SendButtonProps = Partial<NewDirectMessagingSendButtonPropsWithContext>;

/**
 * UI Component for send button in MessageInput component.
 */
export const NewDirectMessagingSendButton = (props: SendButtonProps) => {
  const { chatClient } = useAppContext();
  const navigation = useNavigation<NewDirectMessagingScreenNavigationProp>();
  const { channel } = useChannelContext();
  const { selectedUserIds, reset } = useUserSearchContext();

  const { giphyActive, text } = useMessageInputContext();

  const sendMessage = async () => {
    if (!channel) {
      return;
    }
    if (!chatClient || !chatClient.user) {
      return;
    }
    const members = [chatClient.user.id, ...selectedUserIds];
    channel.initialized = false;
    const newChannel = chatClient.channel('messaging', {
      members,
    });
    try {
      await newChannel.watch();
      await newChannel.sendMessage({ text });
      navigation.replace('ChannelScreen', {
        channelId: newChannel.id,
      });
      reset();
    } catch (e) {
      if (e instanceof Error) {
        Alert.alert('Error sending a message', e.message);
      }
    }
  };

  return (
    <MemoizedNewDirectMessagingSendButton
      {...{ giphyActive, sendMessage }}
      {...props}
      {...{ disabled: props.disabled || false }}
    />
  );
};
