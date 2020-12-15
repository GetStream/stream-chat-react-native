import React from 'react';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { styled } from '../../styles/styledComponents';

const ErrorNotification = styled.View`
  align-items: center;
  background-color: #fae6e8;
  color: red;
  padding: 5px;
  z-index: 10;
  ${({ theme }) => theme.messageList.errorNotification.css}
`;

const ErrorNotificationText = styled.Text`
  background-color: #fae6e8;
  color: red;
  ${({ theme }) => theme.messageList.errorNotificationText.css}
`;

export const NetworkDownIndicator = () => {
  const { t } = useTranslationContext();
  return (
    <ErrorNotification testID='error-notification'>
      <ErrorNotificationText>
        {t('Connection failure, reconnecting now ...')}
      </ErrorNotificationText>
    </ErrorNotification>
  );
};
