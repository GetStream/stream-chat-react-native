import React from 'react';
import { View } from 'react-native';

import {
  useMessageContext,
  type MessageContextValue,
} from '../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { UserAvatarStack } from '../../ui/Avatar/AvatarStack';

export type MessageRepliesAvatarsProps = Partial<Pick<MessageContextValue, 'message'>>;

export const MessageRepliesAvatarsWithContext = (props: MessageRepliesAvatarsProps) => {
  const { message } = props;

  const {
    theme: {
      messageSimple: {
        replies: { avatarStackContainer },
      },
    },
  } = useTheme();

  const avatars = message?.thread_participants || [];

  return (
    <View style={avatarStackContainer}>
      <UserAvatarStack users={avatars} avatarSize='sm' maxVisible={3} overlap={0.4} />
    </View>
  );
};

export const MessageRepliesAvatars = (props: MessageRepliesAvatarsProps) => {
  const { message } = useMessageContext();
  return <MessageRepliesAvatarsWithContext message={message} {...props} />;
};
