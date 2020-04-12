import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const ErrorNotificationText = styled.Text`
  color: red;
  background-color: #fae6e8;
  ${({ theme }) => theme.messageList.errorNotificationText.css}
`;

const ErrorNotification = styled.View`
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
  margin-bottom: 0;
  padding: 5px;
  color: red;
  background-color: #fae6e8;
  ${({ theme }) => theme.messageList.errorNotification.css}
`;

export const ConnectionErrorNotification = ({ renderText, channel }) => (
  <ErrorNotification>
    <ErrorNotificationText>
      {renderText
        ? renderText(channel)
        : 'Connection failure, reconnecting now ...'}
    </ErrorNotificationText>
  </ErrorNotification>
);
ConnectionErrorNotification.propTypes = {
  channel: PropTypes.object,
  /**
   * Renderer function for connection error message/text.
   * @param channel Channel object
   * @returns string
   */
  renderText: PropTypes.func,
};
