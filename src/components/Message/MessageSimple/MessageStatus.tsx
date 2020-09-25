import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components/native';

import Avatar from '../../Avatar/Avatar';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import iconDeliveredUnseen from '../../../images/icons/delivered_unseen.png';
import loadingGif from '../../../images/loading.gif';

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

const SendingImage = styled.View`
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

const MessageStatus = ({
  lastReceivedId,
  message,
  readBy = [],
  threadList,
}) => {
  const { client } = useChatContext();
  const justReadByMe = readBy.length === 1 && readBy[0].id === client.user.id;

  const Status = () => {
    if (message.status === 'sending') {
      return (
        <SendingContainer testID='sending-container'>
          <SendingImage source={loadingGif} />
        </SendingContainer>
      );
    }

    if (
      readBy.length !== 0 &&
      !threadList &&
      message.id === lastReceivedId &&
      !justReadByMe
    ) {
      const lastReadUser = readBy.filter(
        (item) => item.id !== client.user.id,
      )[0];
      return (
        <ReadByContainer testID='read-by-container'>
          <Avatar
            image={lastReadUser.image}
            name={lastReadUser.name || lastReadUser.id}
            size={16}
          />
        </ReadByContainer>
      );
    }

    if (
      message.status === 'received' &&
      message.type !== 'ephemeral' &&
      message.id === lastReceivedId &&
      !threadList
    ) {
      return (
        <DeliveredContainer testID='delivered-container'>
          <DeliveredCircle>
            <CheckMark source={iconDeliveredUnseen} />
          </DeliveredCircle>
        </DeliveredContainer>
      );
    }

    return <Spacer testID='spacer' />;
  };

  return (
    <StatusContainer>
      <Status />
    </StatusContainer>
  );
};

MessageStatus.propTypes = {
  /** Latest message id on current channel */
  lastReceivedId: PropTypes.string,
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: PropTypes.object.isRequired,
  /** A list of users who have read the message */
  readBy: PropTypes.array,
  /** Whether or not the MessageList is part of a Thread */
  threadList: PropTypes.bool,
};

export default MessageStatus;
