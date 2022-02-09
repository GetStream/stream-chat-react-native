import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import { Avatar } from '../../Avatar/Avatar';

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

export type MessageRepliesAvatarsProps<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageContextValue<StreamChatClient>, 'alignment' | 'message'>;

export const MessageRepliesAvatars = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageRepliesAvatarsProps<StreamChatClient>,
) => {
  const { alignment, message } = props;

  const {
    theme: {
      colors: { white_snow },
      messageSimple: {
        replies: {
          avatar,
          avatarContainerMultiple,
          avatarContainerSingle,
          avatarSize,
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
        alignment === 'right' ? { marginLeft: 8, ...rightAvatarsContainer } : leftAvatarsContainer,
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
          <Avatar
            containerStyle={[
              i === 1 && {
                borderColor: white_snow,
                borderWidth: 1,
              },
              avatar,
            ]}
            image={user.image}
            name={user.name}
            size={avatarSize ? avatarSize : i === 1 ? 18 : 16}
          />
        </View>
      ))}
    </View>
  );
};
