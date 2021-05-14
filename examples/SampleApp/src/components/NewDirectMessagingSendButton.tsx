import { useNavigation } from '@react-navigation/core';
import React from 'react';
import { Alert } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import {
  MessageInputContextValue,
  useMessageInputContext,
  useTheme,
  Search,
  SendRight,
  SendUp,
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
  useChannelContext,
} from 'stream-chat-react-native';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
} from '../types';
import { NewDirectMessagingScreenNavigationProp } from '../screens/NewDirectMessagingScreen';
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
  'giphyActive' | 'sendMessage'
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
      {!giphyActive && disabled && <SendRight pathFill={grey_gainsboro} />}
      {!giphyActive && !disabled && <SendUp pathFill={accent_blue} />}
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
 */
export const NewSendButton = (
  props: SendButtonProps<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalReactionType,
    LocalUserType
  >,
) => {
  const navigation = useNavigation<NewDirectMessagingScreenNavigationProp>();
  const { channel } = useChannelContext<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalReactionType,
    LocalUserType
  >();
  const { giphyActive, text } = useMessageInputContext<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalReactionType,
    LocalUserType
  >();
  const sendMessage = async () => {
    if (!channel) return;
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
    <MemoizedSendButton<
      LocalAttachmentType,
      LocalChannelType,
      LocalCommandType,
      LocalEventType,
      LocalMessageType,
      LocalReactionType,
      LocalUserType
    >
      {...{ giphyActive, sendMessage }}
      {...props}
      {...{ disabled: props.disabled || false }}
    />
  );
};
NewSendButton.displayName = 'SendButton{messageInput}';