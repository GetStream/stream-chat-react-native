import React from 'react';
import styled from '@stream-io/styled-components';
import loadingGif from '../../images/loading.gif';
import iconDeliveredUnseen from '../../images/icons/delivered_unseen.png';
import { Avatar } from '../Avatar';

const Spacer = styled.View`
  height: 10;
  width: 25;
`;

const StatusContainer = styled.View`
  width: 25;
  flex-direction: row;
  justify-content: center;
`;

const DeliveredContainer = styled.View`
  display: flex;
  align-items: center;
  width: 20;
  height: 20;
  padding-bottom: 10;
  padding-left: 5;
  ${({ theme }) => theme.message.status.deliveredContainer.css};
`;

const DeliveredCircle = styled.View`
  width: 16;
  height: 16;
  border-radius: 16;
  background-color: ${({ theme }) => theme.colors.primary};
  align-items: center;
  justify-content: center;
  padding: 6px;
  ${({ theme }) => theme.message.status.deliveredCircle.css};
`;

const CheckMark = styled.Image`
  width: 8;
  height: 6;
  ${({ theme }) => theme.message.status.checkMark.css};
`;

const SendingContainer = styled.View`
  display: flex;
  align-items: center;
  padding-left: 5px;
  padding-right: 5px;
  ${({ theme }) => theme.message.status.sendingContainer.css};
`;

const SendingImage = styled.View`
  height: 10;
  width: 10;
  ${({ theme }) => theme.message.status.sendingImage.css};
`;

const ReadByContainer = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  ${({ theme }) => theme.message.status.readByContainer.css};
`;

const ReadByCount = styled.Text`
  font-size: 10;
  color: rgba(0, 0, 0, 0.5);
  margin-left: 2px;
  ${({ theme }) => theme.message.status.readByCount.css};
`;

export const MessageStatus = ({
  client,
  readBy,
  message,
  lastReceivedId,
  threadList,
}) => {
  const renderStatus = () => {
    const justReadByMe = readBy.length === 1 && readBy[0].id === client.user.id;

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
            name={lastReadUser.name || lastReadUser.id}
            image={lastReadUser.image}
            size={16}
          />
          {readBy.length - 1 > 1 && (
            <ReadByCount>{readBy.length - 1}</ReadByCount>
          )}
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
