import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ChatContextValue, useChatContext } from '../../../contexts/chatContext/ChatContext';
import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { UserAvatar } from '../../ui/Avatar/UserAvatar';

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingTop: 2,
  },
  topAvatar: {
    paddingTop: 2,
    position: 'absolute',
  },
});

export type MessageRepliesAvatarsProps = Pick<MessageContextValue, 'alignment' | 'message'>;

export const MessageRepliesAvatarsWithContext = (
  props: MessageRepliesAvatarsProps & Pick<ChatContextValue, 'ImageComponent'>,
) => {
  const { alignment, message } = props;

  const {
    theme: {
      messageSimple: {
        replies: {
          avatarContainerMultiple,
          avatarContainerSingle,
          leftAvatarsContainer,
          rightAvatarsContainer,
        },
      },
    },
  } = useTheme();

  const avatars = message.thread_participants?.slice(-2) || [];
  const hasMoreThanOneReply = avatars.length > 1;

  return (
    <View
      style={[
        styles.avatarContainer,
        alignment === 'right' ? rightAvatarsContainer : leftAvatarsContainer,
      ]}
    >
      {avatars.map((user, i) => (
        <View
          key={user.id}
          style={
            i === 1
              ? { ...styles.topAvatar, ...avatarContainerSingle }
              : {
                  paddingLeft: hasMoreThanOneReply ? 8 : 0,
                  ...avatarContainerMultiple,
                }
          }
        >
          <UserAvatar user={user} size={'xs'} showBorder />
        </View>
      ))}
    </View>
  );
};

export const MessageRepliesAvatars = (props: MessageRepliesAvatarsProps) => {
  const { ImageComponent } = useChatContext();

  return <MessageRepliesAvatarsWithContext {...props} ImageComponent={ImageComponent} />;
};
