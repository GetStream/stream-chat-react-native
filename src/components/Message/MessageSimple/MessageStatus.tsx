import React from 'react';

import { Avatar } from '../../Avatar/Avatar';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { styled } from '../../../styles/styledComponents';

import type { ImageRequireSource } from 'react-native';

import type { ForwardedMessageProps } from './MessageContent';

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

const iconDeliveredUnseen: ImageRequireSource = require('../../../images/icons/delivered_unseen.png');
const loadingGif: ImageRequireSource = require('../../../images/loading.gif');

const CheckMark = styled.Image`
  height: 6px;
  width: 8px;
  ${({ theme }) => theme.message.status.checkMark.css};
`;

const DeliveredCircle = styled.View`
  align-items: center;
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: 16px;
  height: 16px;
  justify-content: center;
  padding: 6px;
  width: 16px;
  ${({ theme }) => theme.message.status.deliveredCircle.css};
`;

const DeliveredContainer = styled.View`
  align-items: center;
  height: 20px;
  ${({ theme }) => theme.message.status.deliveredContainer.css};
`;

const ReadByContainer = styled.View`
  align-items: center;
  flex-direction: row;
  ${({ theme }) => theme.message.status.readByContainer.css};
`;

const SendingContainer = styled.View`
  align-items: center;
  ${({ theme }) => theme.message.status.sendingContainer.css};
`;

const SendingImage = styled.Image`
  height: 10px;
  width: 10px;
  ${({ theme }) => theme.message.status.sendingImage.css};
`;

const Spacer = styled.View`
  height: 10px;
`;

const StatusContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  width: 20px;
`;

export const MessageStatus = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>(
  props: ForwardedMessageProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { lastReceivedId, message, readBy = [], threadList } = props;

  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const justReadByMe = readBy.length === 1 && readBy[0].id === client.user?.id;

  if (message.status === 'sending') {
    return (
      <StatusContainer>
        <SendingContainer testID='sending-container'>
          <SendingImage source={loadingGif} />
        </SendingContainer>
      </StatusContainer>
    );
  }

  if (
    readBy.length !== 0 &&
    !threadList &&
    message.id === lastReceivedId &&
    !justReadByMe
  ) {
    const lastReadUser = readBy.filter(
      (item) => item.id !== client.user?.id,
    )[0];
    return (
      <StatusContainer>
        <ReadByContainer testID='read-by-container'>
          <Avatar
            image={lastReadUser.image}
            name={lastReadUser.name || lastReadUser.id}
            size={16}
          />
        </ReadByContainer>
      </StatusContainer>
    );
  }

  if (
    message.status === 'received' &&
    message.type !== 'ephemeral' &&
    message.id === lastReceivedId &&
    !threadList
  ) {
    return (
      <StatusContainer>
        <DeliveredContainer testID='delivered-container'>
          <DeliveredCircle>
            <CheckMark source={iconDeliveredUnseen} />
          </DeliveredCircle>
        </DeliveredContainer>
      </StatusContainer>
    );
  }

  return (
    <StatusContainer>
      <Spacer testID='spacer' />
    </StatusContainer>
  );
};
