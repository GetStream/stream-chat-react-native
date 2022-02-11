import React from 'react';
import { View } from 'react-native';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import { Avatar, AvatarProps } from '../../Avatar/Avatar';

export type MessageAvatarPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageContextValue<StreamChatGenerics>,
  'alignment' | 'lastGroupMessage' | 'message' | 'showAvatar'
> &
  Partial<Pick<AvatarProps, 'size'>>;

const MessageAvatarWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageAvatarPropsWithContext<StreamChatGenerics>,
) => {
  const { alignment, lastGroupMessage, message, showAvatar, size } = props;
  const {
    theme: {
      avatar: { BASE_AVATAR_SIZE },
      messageSimple: {
        avatarWrapper: { container, leftAlign, rightAlign, spacer },
      },
    },
  } = useTheme();

  const visible = typeof showAvatar === 'boolean' ? showAvatar : lastGroupMessage;

  return (
    <View
      style={[alignment === 'left' ? leftAlign : rightAlign, container]}
      testID='message-avatar'
    >
      {visible ? (
        <Avatar
          image={message.user?.image}
          name={message.user?.name || message.user?.id}
          size={size || BASE_AVATAR_SIZE}
        />
      ) : (
        <View style={spacer} testID='spacer' />
      )}
    </View>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MessageAvatarPropsWithContext<StreamChatGenerics>,
  nextProps: MessageAvatarPropsWithContext<StreamChatGenerics>,
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

const MemoizedMessageAvatar = React.memo(
  MessageAvatarWithContext,
  areEqual,
) as typeof MessageAvatarWithContext;

export type MessageAvatarProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<MessageAvatarPropsWithContext<StreamChatGenerics>>;

export const MessageAvatar = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageAvatarProps<StreamChatGenerics>,
) => {
  const { alignment, lastGroupMessage, message, showAvatar } =
    useMessageContext<StreamChatGenerics>();

  return (
    <MemoizedMessageAvatar
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

MessageAvatar.displayName = 'MessageAvatar{messageSimple{avatarWrapper}}';
