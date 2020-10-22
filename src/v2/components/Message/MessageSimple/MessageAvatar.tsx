import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '../../Avatar/Avatar';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import type { ForwardedMessageProps } from './MessageContent';

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

const styles = StyleSheet.create({
  leftAlign: {
    marginLeft: 0,
    marginRight: 8,
  },
  rightAlign: {
    marginLeft: 8,
    marginRight: 0,
  },
  spacer: {
    height: 28,
    width: 32,
  },
});

export type MessageAvatarProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
> = ForwardedMessageProps<At, Ch, Co, Ev, Me, Re, Us> & {
  showAvatar?: boolean;
};

export const MessageAvatar = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>(
  props: MessageAvatarProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { alignment, groupStyles, message, showAvatar } = props;

  const {
    theme: {
      message: {
        avatarWrapper: { container, spacer },
      },
    },
  } = useTheme();

  const visible =
    typeof showAvatar === 'boolean'
      ? showAvatar
      : groupStyles[0] === 'single' || groupStyles[0] === 'bottom';

  return (
    <View
      style={[
        alignment === 'left' ? styles.leftAlign : styles.rightAlign,
        container,
      ]}
      testID='message-avatar'
    >
      {visible ? (
        <Avatar
          image={message.user?.image}
          name={message.user?.name || message.user?.id}
        />
      ) : (
        <View style={[styles.spacer, spacer]} testID='spacer' />
      )}
    </View>
  );
};

MessageAvatar.displayName = 'MessageAvatar{message{avatarWrapper}}';
