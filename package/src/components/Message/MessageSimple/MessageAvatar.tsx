import React from 'react';
import { View } from 'react-native';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { AvatarProps, UserAvatar } from '../../ui';

export type MessageAvatarPropsWithContext = Pick<
  MessageContextValue,
  'alignment' | 'lastGroupMessage' | 'message' | 'showAvatar'
> &
  Partial<Pick<AvatarProps, 'size'>>;

const MessageAvatarWithContext = (props: MessageAvatarPropsWithContext) => {
  const { alignment, lastGroupMessage, message, showAvatar, size } = props;
  const {
    theme: {
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
      {visible && message.user ? (
        <UserAvatar user={message.user} size={size ?? 'sm'} />
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
