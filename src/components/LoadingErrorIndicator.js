import React from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';
import { withTranslationContext } from '../context';

const Container = styled.TouchableOpacity`
  height: 100%;
  justify-content: center;
  align-items: center;
  ${({ theme }) => theme.loadingErrorIndicator.container.css}
`;

const ErrorText = styled.Text`
  margin-top: 20px;
  font-size: 14px;
  font-weight: 600;
  ${({ theme }) => theme.loadingErrorIndicator.errorText.css}
`;

const RetryText = styled.Text`
  font-size: 30px;
  font-weight: 600;
  ${({ theme }) => theme.loadingErrorIndicator.retryText.css}
`;

const LoadingErrorIndicator = ({ listType, retry, t }) => {
  let Loader;
  switch (listType) {
    case 'channel':
      Loader = (
        <Container
          onPress={() => {
            retry && retry();
          }}
        >
          <ErrorText>{t('Error loading channel list ...')}</ErrorText>
          <RetryText>⟳</RetryText>
        </Container>
      );
      break;
    case 'message':
      Loader = (
        <Container>
          <ErrorText>
            {t('Error loading messages for this channel ...')}
          </ErrorText>
        </Container>
      );
      break;
    default:
      Loader = (
        <Container>
          <ErrorText>{t('Error loading')}</ErrorText>
        </Container>
      );
      break;
  }

  return Loader;
};

LoadingErrorIndicator.propTypes = {
  listType: PropTypes.oneOf(['channel', 'message', 'default']),
  // Calls the retry handler.
  retry: PropTypes.func,
};

const LoadingErrorIndicatorWithContext = withTranslationContext(
  LoadingErrorIndicator,
);
export { LoadingErrorIndicatorWithContext as LoadingErrorIndicator };
