import React, { useContext } from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import { TranslationContext } from '../../context';
import { Spinner } from '../Spinner';

const Container = styled.View`
  align-items: center;
  height: 100%;
  justify-content: center;
  ${({ theme }) => theme.loadingIndicator.container.css}
`;
const LoadingText = styled.Text`
  font-size: 14px;
  font-weight: 600;
  margin-top: 20px;
  ${({ theme }) => theme.loadingIndicator.loadingText.css}
`;

const LoadingIndicator = ({ listType = 'default', loadingText }) => {
  const { t } = useContext(TranslationContext);
  let indicatorText = '';

  switch (listType) {
    case 'channel':
      indicatorText = loadingText ? loadingText : t('Loading channels ...');
      break;
    case 'message':
      indicatorText = loadingText ? loadingText : t('Loading messages ...');
      break;
    case 'default':
    default:
      indicatorText = loadingText ? loadingText : t('Loading ...');
  }

  return (
    <Container>
      <Spinner />
      <LoadingText testID='loading'>{indicatorText}</LoadingText>
    </Container>
  );
};

LoadingIndicator.propTypes = {
  listType: PropTypes.oneOf(['channel', 'message', 'default']),
  loadingText: PropTypes.string,
};

export default LoadingIndicator;
