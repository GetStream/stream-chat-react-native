import React from 'react';
import { View } from 'react-native';

import { ChatContextValue, useChatContext } from '../../../contexts/chatContext/ChatContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import { Avatar, AvatarProps } from '../../Avatar/Avatar';

export type MessageAvatarPropsWithContext = Pick<
  MessageContextValue,
  'alignment' | 'lastGroupMessage' | 'message' | 'showAvatar'
> &
  Pick<ChatContextValue, 'ImageComponent'> &
  Partial<Pick<AvatarProps, 'size'>>;

const MessageAvatarWithContext = (props: MessageAvatarPropsWithContext) => {
  const { alignment, ImageComponent, lastGroupMessage, message, showAvatar, size } = props;
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
          ImageComponent={ImageComponent}
          name={message.user?.name || message.user?.id}
          size={size || BASE_AVATAR_SIZE}
        />
      ) : (
        <View style={spacer} testID='spacer' />
      )}
    </View>
  );
};

const areEqual = (
  prevProps: MessageAvatarPropsWithContext,
  nextProps: MessageAvatarPropsWithContext,
) => {
  const { lastGroupMessage: prevLastGroupMessage, message: prevMessage } = prevProps;
  const { lastGroupMessage: nextLastGroupMessage, message: nextMessage } = nextProps;

  const lastGroupMessageEqual = prevLastGroupMessage === nextLastGroupMessage;
  if (!lastGroupMessageEqual) {
    return false;
  }

  const userEqual =
    prevMessage.user?.image === nextMessage.user?.image &&
    prevMessage.user?.name === nextMessage.user?.name &&
    prevMessage.user?.id === nextMessage.user?.id;
  if (!userEqual) {
    return false;
  }

  return true;
};

const MemoizedMessageAvatar = React.memo(
  MessageAvatarWithContext,
  areEqual,
) as typeof MessageAvatarWithContext;

export type MessageAvatarProps = Partial<MessageAvatarPropsWithContext>;

export const MessageAvatar = (props: MessageAvatarProps) => {
  const { alignment, lastGroupMessage, message, showAvatar } = useMessageContext();
  const { ImageComponent } = useChatContext();

  return (
    <MemoizedMessageAvatar
      {...{
        alignment,
        ImageComponent,
        lastGroupMessage,
        message,
        showAvatar,
      }}
      {...props}
    />
  );
};

MessageAvatar.displayName = 'MessageAvatar{messageSimple{avatarWrapper}}';
