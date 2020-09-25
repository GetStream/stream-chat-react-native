import React from 'react';

import Avatar from '../../Avatar/Avatar';

import { styled } from '../../../styles/styledComponents';

import type { MessageSimpleProps } from './MessageSimple';
import type { Alignment } from '../../../contexts/messagesContext/MessagesContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

const Container = styled.View<{ alignment: Alignment }>`
  margin-right: ${({ alignment }) => (alignment === 'left' ? 8 : 0)}px;
  margin-left: ${({ alignment }) => (alignment === 'right' ? 8 : 0)}px;
  ${({ theme }) => theme.message.avatarWrapper.container.css}
`;

const Spacer = styled.View`
  height: 28px;
  width: 32px;
  ${({ theme }) => theme.message.avatarWrapper.spacer.css}
`;

export type MessageAvatarProps<
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends Record<string, unknown> = DefaultEventType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
> = MessageSimpleProps<At, Ch, Co, Ev, Me, Re, Us> & {
  /**
   * Avatar alignment: 'left' or 'right'
   */
  alignment: Alignment;
  /**
   * Whether or not the app is using a custom MessageContent component
   */
  customMessageContent: boolean;
  /**
   * Whether or not to show the user's image avatar
   */
  showAvatar?: boolean;
};

const MessageAvatar = <
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends Record<string, unknown> = DefaultEventType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>({
  alignment,
  groupStyles,
  message,
  showAvatar,
}: MessageAvatarProps<At, Ch, Co, Ev, Me, Re, Us>) => {
  const visible =
    typeof showAvatar === 'boolean'
      ? showAvatar
      : groupStyles[0] === 'single' || groupStyles[0] === 'bottom';

  return (
    <Container alignment={alignment} testID='message-avatar'>
      {visible ? (
        <Avatar
          image={message.user?.image}
          name={message.user?.name || message.user?.id}
        />
      ) : (
        <Spacer testID='spacer' />
      )}
    </Container>
  );
};

export default MessageAvatar;
