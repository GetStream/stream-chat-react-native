import React from 'react';
import { View } from 'react-native';

import type { ExtendableGenerics } from 'stream-chat';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import { Avatar, AvatarProps } from '../../Avatar/Avatar';

export type MessageAvatarPropsWithContext<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageContextValue<StreamChatClient>,
  'alignment' | 'lastGroupMessage' | 'message' | 'showAvatar'
> &
  Partial<Pick<AvatarProps, 'size'>>;

const MessageAvatarWithContext = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  props: MessageAvatarPropsWithContext<StreamChatClient>,
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

const areEqual = <StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics>(
  prevProps: MessageAvatarPropsWithContext<StreamChatClient>,
  nextProps: MessageAvatarPropsWithContext<StreamChatClient>,
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
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = Partial<MessageAvatarPropsWithContext<StreamChatClient>>;

export const MessageAvatar = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  props: MessageAvatarProps<StreamChatClient>,
) => {
  const { alignment, lastGroupMessage, message, showAvatar } =
    useMessageContext<StreamChatClient>();

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
