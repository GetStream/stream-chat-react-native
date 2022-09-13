import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ChatContextValue, useChatContext } from '../../../contexts/chatContext/ChatContext';
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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageContextValue<StreamChatGenerics>, 'alignment' | 'message'>;

export const MessageRepliesAvatarsWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageRepliesAvatarsProps<StreamChatGenerics> & Pick<ChatContextValue, 'ImageComponent'>,
) => {
  const { alignment, ImageComponent, message } = props;

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
            ImageComponent={ImageComponent}
            name={user.name}
            size={avatarSize ? avatarSize : i === 1 ? 18 : 16}
          />
        </View>
      ))}
    </View>
  );
};

export const MessageRepliesAvatars = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageRepliesAvatarsProps<StreamChatGenerics>,
) => {
  const { ImageComponent } = useChatContext();

  return <MessageRepliesAvatarsWithContext {...props} ImageComponent={ImageComponent} />;
};
