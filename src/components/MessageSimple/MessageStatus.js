import React from 'react';
import styled from 'styled-components';
import loadingGif from '../../images/loading.gif';
import iconDeliveredUnseen from '../../images/icons/delivered_unseen.png';
import { getTheme } from '../styles/theme';

const Spacer = styled.View`
  height: ${(props) => getTheme(props).messageStatus.spacer.height};
  width: ${(props) => getTheme(props).messageStatus.spacer.width};
`;

const DeliveredContainer = styled.View`
  display: ${(props) =>
    getTheme(props).messageStatus.deliveredContainer.display};
  align-items: ${(props) =>
    getTheme(props).messageStatus.deliveredContainer.alignItems};
  width: ${(props) => getTheme(props).messageStatus.deliveredContainer.width};
  height: ${(props) => getTheme(props).messageStatus.deliveredContainer.height};
  padding-bottom: ${(props) =>
    getTheme(props).messageStatus.deliveredContainer.paddingBottom};
  padding-left: ${(props) =>
    getTheme(props).messageStatus.deliveredContainer.paddingLeft};
`;

const DeliveredCircle = styled.View`
  width: ${(props) => getTheme(props).messageStatus.deliveredCircle.width};
  height: ${(props) => getTheme(props).messageStatus.deliveredCircle.height};
  border-radius: ${(props) =>
    getTheme(props).messageStatus.deliveredCircle.borderRadius};
  background-color: ${(props) => getTheme(props).colors.primary};
  align-items: ${(props) =>
    getTheme(props).messageStatus.deliveredCircle.alignItems};
  justify-content: ${(props) =>
    getTheme(props).messageStatus.deliveredCircle.justifyContent};
  padding: ${(props) =>
    getTheme(props).messageStatus.deliveredCircle.padding}px;
`;

const CheckMark = styled.Image`
  width: ${(props) => getTheme(props).messageStatus.checkMark.width};
  height: ${(props) => getTheme(props).messageStatus.checkMark.height};
`;

const SendingContainer = styled.View`
  display: ${(props) => getTheme(props).messageStatus.sendingContainer.display};
  align-items: ${(props) =>
    getTheme(props).messageStatus.sendingContainer.alignItems};
  padding-left: ${(props) =>
    getTheme(props).messageStatus.sendingContainer.paddingLeft};
  padding-right: ${(props) =>
    getTheme(props).messageStatus.sendingContainer.paddingRight};
`;

const SendingImage = styled.View`
  height: ${(props) => getTheme(props).messageStatus.sendingImage.height};
  width: ${(props) => getTheme(props).messageStatus.sendingImage.width};
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
