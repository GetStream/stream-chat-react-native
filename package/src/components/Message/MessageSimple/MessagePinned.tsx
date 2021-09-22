import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pin } from 'stream-chat-react-native';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  view: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 8,
  },
  text: {
    marginLeft: 5,
  },
});

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export type MessagePinnedPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType,
> = Pick<
  MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  'alignment' | 'lastGroupMessage' | 'message' | 'showAvatar'
>;

const MessagePinnedWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType,
>(
  props: MessagePinnedPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { alignment } = props;
  const {
    theme: {
      colors: { grey },
    },
  } = useTheme();

  return (
    <View
      style={[styles.view, { justifyContent: alignment === 'left' ? 'flex-start' : 'flex-end' }]}
      testID='message-avatar'
    >
      <Pin height={16} width={24} pathFill={grey} />
      <Text style={[{ color: grey }, styles.text]}>Pinned by You</Text>
    </View>
  );
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  prevProps: MessagePinnedPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessagePinnedPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { lastGroupMessage: prevLastGroupMessage, message: prevMessage } = prevProps;
  const { lastGroupMessage: nextLastGroupMessage, message: nextMessage } = nextProps;

  const lastGroupMessageEqual = prevLastGroupMessage === nextLastGroupMessage;
  if (!lastGroupMessageEqual) return false;

  const userEqual =
    prevMessage.user?.image === nextMessage.user?.image &&
    prevMessage.user?.name === nextMessage.user?.name &&
    prevMessage.user?.id === nextMessage.user?.id;
  if (!userEqual) return false;

  return true;
};

const MemoizedMessagePinned = React.memo(
  MessagePinnedWithContext,
  areEqual,
) as typeof MessagePinnedWithContext;

export type MessageAvatarProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType,
> = Partial<MessagePinnedPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

export const MessagePinned = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType,
>(
  props: MessageAvatarProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { alignment, lastGroupMessage, message, showAvatar } =
    useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();

  return (
    <MemoizedMessagePinned
      {...{
        alignment,
        lastGroupMessage,
        message,
        showAvatar,
      }}
      {...props}
    />
  );
};

MessagePinned.displayName = 'MessagePinned{messageSimple{pinned}}';
