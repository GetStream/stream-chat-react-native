import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components/native';

import Avatar from '../../Avatar/Avatar';

import loadingGif from '../../../images/loading.gif';
import iconDeliveredUnseen from '../../../images/icons/delivered_unseen.png';

const Spacer = styled.View`
  height: 10px;
`;

const StatusContainer = styled.View`
  width: 20px;
  flex-direction: row;
  justify-content: center;
`;

const DeliveredContainer = styled.View`
  display: flex;
  align-items: center;
  height: 20px;
  ${({ theme }) => theme.message.status.deliveredContainer.css};
`;

const DeliveredCircle = styled.View`
  width: 16px;
  height: 16px;
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.primary};
  align-items: center;
  justify-content: center;
  padding: 6px;
  ${({ theme }) => theme.message.status.deliveredCircle.css};
`;

const CheckMark = styled.Image`
  height: 6px;
  width: 8px;
  ${({ theme }) => theme.message.status.checkMark.css};
`;

const SendingContainer = styled.View`
  display: flex;
  align-items: center;
  ${({ theme }) => theme.message.status.sendingContainer.css};
`;

const SendingImage = styled.View`
  height: 10px;
  width: 10px;
  ${({ theme }) => theme.message.status.sendingImage.css};
`;

const ReadByContainer = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  ${({ theme }) => theme.message.status.readByContainer.css};
`;

const MessageStatus = ({
  client,
  readBy,
  message,
  lastReceivedId,
  threadList,
}) => {
  const renderStatus = () => {
    const justReadByMe =
      readBy.length === 1 && readBy[0] && readBy[0].id === client.user.id;

    if (message.status === 'sending') {
      return (
        <SendingContainer>
          <SendingImage source={loadingGif} />
        </SendingContainer>
      );
    } else if (
      readBy.length !== 0 &&
      !threadList &&
      message.id === lastReceivedId &&
      !justReadByMe
    ) {
      const lastReadUser = readBy.filter(
        (item) => item.id !== client.user.id,
      )[0];
      return (
        <ReadByContainer>
          <Avatar
            image={lastReadUser.image}
            name={lastReadUser.name || lastReadUser.id}
            size={16}
          />
        </ReadByContainer>
      );
    } else if (
      message.status === 'received' &&
      message.type !== 'ephemeral' &&
      message.id === lastReceivedId &&
      !threadList
    ) {
      return (
        <DeliveredContainer>
          <DeliveredCircle>
            <CheckMark source={iconDeliveredUnseen} />
          </DeliveredCircle>
        </DeliveredContainer>
      );
    } else {
      return <Spacer />;
    }
  };

  return <StatusContainer>{renderStatus()}</StatusContainer>;
};

MessageStatus.propTypes = {
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
  client: PropTypes.object,
  /** Boolean if current message is part of thread */
  isThreadList: PropTypes.bool,
  /** Latest message id on current channel */
  lastReceivedId: PropTypes.string,
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: PropTypes.object,
  /** A list of users who have read the message */
  readBy: PropTypes.array,
};

export default MessageStatus;
