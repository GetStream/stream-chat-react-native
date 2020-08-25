import React, { useContext } from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import { Avatar } from '../../Avatar';
import { ChatContext } from '../../../context';
import iconDeliveredUnseen from '../../../images/icons/delivered_unseen.png';
import loadingGif from '../../../images/loading.gif';

const CheckMark = styled.Image`
  height: 6;
  width: 8;
  ${({ theme }) => theme.message.status.checkMark.css};
`;

const DeliveredCircle = styled.View`
  align-items: center;
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: 16;
  height: 16;
  justify-content: center;
  padding: 6px;
  width: 16;
  ${({ theme }) => theme.message.status.deliveredCircle.css};
`;

const DeliveredContainer = styled.View`
  align-items: center;
  display: flex;
  height: 20;
  ${({ theme }) => theme.message.status.deliveredContainer.css};
`;

const ReadByContainer = styled.View`
  align-items: center;
  display: flex;
  flex-direction: row;
  ${({ theme }) => theme.message.status.readByContainer.css};
`;

const SendingContainer = styled.View`
  align-items: center;
  display: flex;
  ${({ theme }) => theme.message.status.sendingContainer.css};
`;

const SendingImage = styled.View`
  height: 10;
  width: 10;
  ${({ theme }) => theme.message.status.sendingImage.css};
`;

const Spacer = styled.View`
  height: 10;
`;

const StatusContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  width: 20;
`;

const MessageStatus = ({ lastReceivedId, message, readBy, threadList }) => {
  const { client } = useContext(ChatContext);
  const justReadByMe =
    readBy.length === 1 && readBy[0] && readBy[0].id === client.user.id;

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
  readBy: PropTypes.array.isRequired,
};

export default MessageStatus;
