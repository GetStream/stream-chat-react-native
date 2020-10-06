import React from 'react';

import { Avatar } from '../../Avatar/Avatar';

import { styled } from '../../../styles/styledComponents';

import type { ForwardedMessageProps } from './MessageContent';

import type { Alignment } from '../../../contexts/messagesContext/MessagesContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

const Container = styled.View<{ alignment: Alignment }>`
  margin-left: ${({ alignment }) => (alignment === 'right' ? 8 : 0)}px;
  margin-right: ${({ alignment }) => (alignment === 'left' ? 8 : 0)}px;
  ${({ theme }) => theme.message.avatarWrapper.container.css}
`;

const Spacer = styled.View`
  height: 28px;
  width: 32px;
  ${({ theme }) => theme.message.avatarWrapper.spacer.css}
`;

export type MessageAvatarProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
> = ForwardedMessageProps<At, Ch, Co, Ev, Me, Re, Us> & {
  showAvatar?: boolean;
};

export const MessageAvatar = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>(
  props: MessageAvatarProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { alignment, groupStyles, message, showAvatar } = props;

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
