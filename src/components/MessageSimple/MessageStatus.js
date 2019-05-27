import React from 'react';
import styled from '@stream-io/styled-components';
import loadingGif from '../../images/loading.gif';
import iconDeliveredUnseen from '../../images/icons/delivered_unseen.png';

const Spacer = styled.View`
  height: ${({ theme }) => theme.messageStatus.spacer.height};
  width: ${({ theme }) => theme.messageStatus.spacer.width};
`;

const DeliveredContainer = styled.View`
  display: ${({ theme }) => theme.messageStatus.deliveredContainer.display};
  align-items: ${({ theme }) =>
    theme.messageStatus.deliveredContainer.alignItems};
  width: ${({ theme }) => theme.messageStatus.deliveredContainer.width};
  height: ${({ theme }) => theme.messageStatus.deliveredContainer.height};
  padding-bottom: ${({ theme }) =>
    theme.messageStatus.deliveredContainer.paddingBottom};
  padding-left: ${({ theme }) =>
    theme.messageStatus.deliveredContainer.paddingLeft};
`;

const DeliveredCircle = styled.View`
  width: ${({ theme }) => theme.messageStatus.deliveredCircle.width};
  height: ${({ theme }) => theme.messageStatus.deliveredCircle.height};
  border-radius: ${({ theme }) =>
    theme.messageStatus.deliveredCircle.borderRadius};
  background-color: ${({ theme }) => theme.colors.primary};
  align-items: ${({ theme }) => theme.messageStatus.deliveredCircle.alignItems};
  justify-content: ${({ theme }) =>
    theme.messageStatus.deliveredCircle.justifyContent};
  padding: ${({ theme }) => theme.messageStatus.deliveredCircle.padding}px;
`;

const CheckMark = styled.Image`
  width: ${({ theme }) => theme.messageStatus.checkMark.width};
  height: ${({ theme }) => theme.messageStatus.checkMark.height};
`;

const SendingContainer = styled.View`
  display: ${({ theme }) => theme.messageStatus.sendingContainer.display};
  align-items: ${({ theme }) =>
    theme.messageStatus.sendingContainer.alignItems};
  padding-left: ${({ theme }) =>
    theme.messageStatus.sendingContainer.paddingLeft};
  padding-right: ${({ theme }) =>
    theme.messageStatus.sendingContainer.paddingRight};
`;

const SendingImage = styled.View`
  height: ${({ theme }) => theme.messageStatus.sendingImage.height};
  width: ${({ theme }) => theme.messageStatus.sendingImage.width};
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
