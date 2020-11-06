import React from 'react';
import { View } from 'react-native';

import { Avatar } from '../../Avatar/Avatar';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

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

export type MessageAvatarPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
> = Pick<
  MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  'alignment' | 'lastGroupMessage' | 'message' | 'showAvatar'
>;

const MessageAvatarWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>(
  props: MessageAvatarPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { alignment, lastGroupMessage, message, showAvatar } = props;
  const {
    theme: {
      messageSimple: {
        avatarWrapper: { container, leftAlign, rightAlign, spacer },
      },
    },
  } = useTheme();

  const visible =
    typeof showAvatar === 'boolean' ? showAvatar : lastGroupMessage;

  return (
    <View
      style={[alignment === 'left' ? leftAlign : rightAlign, container]}
      testID='message-avatar'
    >
      {visible ? (
        <Avatar
          image={message.user?.image}
          name={message.user?.name || message.user?.id}
        />
      ) : (
        <View style={spacer} testID='spacer' />
      )}
    </View>
  );
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: MessageAvatarPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessageAvatarPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    lastGroupMessage: prevLastGroupMessage,
    message: prevMessage,
  } = prevProps;
  const {
    lastGroupMessage: nextLastGroupMessage,
    message: nextMessage,
  } = nextProps;

  const lastGroupMessageEqual = prevLastGroupMessage === nextLastGroupMessage;
  const userEqual =
    prevMessage.user?.image === nextMessage.user?.image &&
    prevMessage.user?.name === nextMessage.user?.name &&
    prevMessage.user?.id === nextMessage.user?.id;

  return lastGroupMessageEqual && userEqual;
};

const MemoizedMessageAvatar = React.memo(
  MessageAvatarWithContext,
  areEqual,
) as typeof MessageAvatarWithContext;

export type MessageAvatarProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
> = Partial<MessageAvatarPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

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
  const {
    alignment: propAlignment,
    lastGroupMessage: propLastGroupMessage,
    message: propMessage,
    showAvatar: propShowAvatar,
  } = props;

  const {
    alignment: contextAlignment,
    lastGroupMessage: contextLastGroupMessage,
    message: contextMessage,
    showAvatar: contextShowAvatar,
  } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();

  const alignment = propAlignment || contextAlignment;
  const lastGroupMessage = propLastGroupMessage || contextLastGroupMessage;
  const message = propMessage || contextMessage;
  const showAvatar = propShowAvatar || contextShowAvatar;

  return (
    <MemoizedMessageAvatar
      {...{
        alignment,
        lastGroupMessage,
        message,
        showAvatar,
      }}
    />
  );
};

MessageAvatar.displayName = 'MessageAvatar{messageSimple{avatarWrapper}}';
