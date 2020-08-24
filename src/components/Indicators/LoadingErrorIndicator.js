import React, { useContext } from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import { TranslationContext } from '../../context';
import { themed } from '../../styles/theme';

const Container = styled.TouchableOpacity`
  align-items: center;
  height: 100%;
  justify-content: center;
  ${({ theme }) => theme.loadingErrorIndicator.container.css};
`;

const ErrorText = styled.Text`
  font-size: 14px;
  font-weight: 600;
  margin-top: 20px;
  ${({ theme }) => theme.loadingErrorIndicator.errorText.css};
`;

const RetryText = styled.Text`
  font-size: 30px;
  font-weight: 600;
  ${({ theme }) => theme.loadingErrorIndicator.retryText.css};
`;

const LoadingErrorIndicator = ({ listType, retry }) => {
  const { t } = useContext(TranslationContext);

  switch (listType) {
    case 'channel':
      return (
        <Container
          onPress={() => {
            retry && retry();
          }}
        >
          <ErrorText testID='loading-error'>
            {t('Error loading channel list ...')}
          </ErrorText>
          <RetryText>⟳</RetryText>
        </Container>
      );
    case 'message':
      return (
        <Container>
          <ErrorText testID='loading-error'>
            {t('Error loading messages for this channel ...')}
          </ErrorText>
        </Container>
      );
    default:
      return (
        <Container>
          <ErrorText testID='loading-error'>{t('Error loading')}</ErrorText>
        </Container>
      );
  }
};

LoadingErrorIndicator.propTypes = {
  // Type of list
  listType: PropTypes.oneOf(['channel', 'message', 'default']),
  // Calls the retry handler.
  retry: PropTypes.func,
};

LoadingErrorIndicator.themePath = 'loadingErrorIndicator';

export default themed(LoadingErrorIndicator);
