import React from 'react';
import styled from '@stream-io/styled-components';
import loadingGif from '../../images/loading.gif';
import iconDeliveredUnseen from '../../images/icons/delivered_unseen.png';

const Spacer = styled.View`
  height: ${(props) => props.theme.messageStatus.spacer.height};
  width: ${(props) => props.theme.messageStatus.spacer.width};
`;

const DeliveredContainer = styled.View`
  display: ${(props) => props.theme.messageStatus.deliveredContainer.display};
  align-items: ${(props) =>
    props.theme.messageStatus.deliveredContainer.alignItems};
  width: ${(props) => props.theme.messageStatus.deliveredContainer.width};
  height: ${(props) => props.theme.messageStatus.deliveredContainer.height};
  padding-bottom: ${(props) =>
    props.theme.messageStatus.deliveredContainer.paddingBottom};
  padding-left: ${(props) =>
    props.theme.messageStatus.deliveredContainer.paddingLeft};
`;

const DeliveredCircle = styled.View`
  width: ${(props) => props.theme.messageStatus.deliveredCircle.width};
  height: ${(props) => props.theme.messageStatus.deliveredCircle.height};
  border-radius: ${(props) =>
    props.theme.messageStatus.deliveredCircle.borderRadius};
  background-color: ${(props) => props.theme.colors.primary};
  align-items: ${(props) =>
    props.theme.messageStatus.deliveredCircle.alignItems};
  justify-content: ${(props) =>
    props.theme.messageStatus.deliveredCircle.justifyContent};
  padding: ${(props) => props.theme.messageStatus.deliveredCircle.padding}px;
`;

const CheckMark = styled.Image`
  width: ${(props) => props.theme.messageStatus.checkMark.width};
  height: ${(props) => props.theme.messageStatus.checkMark.height};
`;

const SendingContainer = styled.View`
  display: ${(props) => props.theme.messageStatus.sendingContainer.display};
  align-items: ${(props) =>
    props.theme.messageStatus.sendingContainer.alignItems};
  padding-left: ${(props) =>
    props.theme.messageStatus.sendingContainer.paddingLeft};
  padding-right: ${(props) =>
    props.theme.messageStatus.sendingContainer.paddingRight};
`;

const SendingImage = styled.View`
  height: ${(props) => props.theme.messageStatus.sendingImage.height};
  width: ${(props) => props.theme.messageStatus.sendingImage.width};
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
