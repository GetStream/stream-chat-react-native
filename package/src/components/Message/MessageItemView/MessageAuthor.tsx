import React from 'react';
import { View } from 'react-native';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { AvatarProps, UserAvatar } from '../../ui';
import { avatarSizes } from '../../ui/Avatar/constants';

export type MessageAuthorPropsWithContext = Pick<
  MessageContextValue,
  'lastGroupMessage' | 'message' | 'showAvatar'
> &
  Partial<Pick<AvatarProps, 'size'>>;

const MessageAuthorWithContext = (props: MessageAuthorPropsWithContext) => {
  const { lastGroupMessage, message, showAvatar, size } = props;
  const {
    theme: {
      messageItemView: {
        authorWrapper: { container },
      },
    },
  } = useTheme();

  const visible = typeof showAvatar === 'boolean' ? showAvatar : lastGroupMessage;

  return (
    <View style={container} testID='message-author'>
      {visible && message.user ? (
        <UserAvatar user={message.user} size={size ?? 'md'} />
      ) : (
        <View style={avatarSizes[size ?? 'md']} testID='spacer' />
      )}
    </View>
  );
};

const areEqual = (
  prevProps: MessageAuthorPropsWithContext,
  nextProps: MessageAuthorPropsWithContext,
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

const MemoizedMessageAuthor = React.memo(
  MessageAuthorWithContext,
  areEqual,
) as typeof MessageAuthorWithContext;

export type MessageAuthorProps = Partial<MessageAuthorPropsWithContext>;

export const MessageAuthor = (props: MessageAuthorProps) => {
  const { lastGroupMessage, message, showAvatar } = useMessageContext();

  return (
    <MemoizedMessageAuthor
      {...{
        lastGroupMessage,
        message,
        showAvatar,
      }}
      {...props}
    />
  );
};

MessageAuthor.displayName = 'MessageAuthor{messageItemView{authorWrapper}}';
