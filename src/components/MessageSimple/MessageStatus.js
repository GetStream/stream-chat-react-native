import React from 'react';
import styled from '@stream-io/styled-components';
import loadingGif from '../../images/loading.gif';
import iconDeliveredUnseen from '../../images/icons/delivered_unseen.png';

const Spacer = styled.View`
  height: 10;
  width: 20;
`;

const DeliveredContainer = styled.View`
  display: flex;
  align-items: center;
  width: 20;
  height: 20;
  padding-bottom: 10;
  padding-left: 5;
  ${({ theme }) => theme.messageStatus.deliveredContainer.extra};
`;

const DeliveredCircle = styled.View`
  width: 16;
  height: 16;
  border-radius: 16;
  background-color: ${({ theme }) => theme.colors.primary};
  align-items: center;
  justify-content: center;
  padding: 6px;
  ${({ theme }) => theme.messageStatus.deliveredCircle.extra};
`;

const CheckMark = styled.Image`
  width: 8;
  height: 6;
  ${({ theme }) => theme.messageStatus.deletedContainer.extra};
`;

const SendingContainer = styled.View`
  display: flex;
  align-items: center;
  padding-left: 5px;
  padding-right: 5px;
  ${({ theme }) => theme.meessageStatus.sendingContainer.extra};
`;

const SendingImage = styled.View`
  height: 10;
  width: 10};
  ${({ theme }) => theme.messageStatus.sendingImage.extra};
`;

export const MessageStatus = ({ message, lastReceivedId, threadList }) => {
  if (message.status === 'sending') {
    return (
      <SendingContainer>
        <SendingImage source={loadingGif} />
      </SendingContainer>
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
