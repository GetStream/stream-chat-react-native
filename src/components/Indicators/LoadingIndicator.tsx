import React from 'react';

import Spinner from '../Spinner/Spinner';

import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { styled } from '../../styles/styledComponents';
import { themed } from '../../styles/theme';

const Container = styled.View`
  align-items: center;
  height: 100%;
  justify-content: center;
  ${({ theme }) => theme.loadingIndicator.container.css};
`;
const LoadingText = styled.Text`
  font-size: 14px;
  font-weight: 600;
  margin-top: 20px;
  ${({ theme }) => theme.loadingIndicator.loadingText.css};
`;

export type LoadingProps = {
  listType?: 'channel' | 'message' | 'default';
  loadingText?: string;
};

/**
 * UI Component for LoadingIndicator
 *
 * @example ./LoadingIndicator.md
 */
const LoadingIndicator: React.FC<LoadingProps> & { themePath: string } = ({
  listType,
  loadingText,
}) => {
  const { t } = useTranslationContext();
  let indicatorText = '';

  switch (listType) {
    case 'channel':
      indicatorText = loadingText ? loadingText : t('Loading channels ...');
      break;
    case 'message':
      indicatorText = loadingText ? loadingText : t('Loading messages ...');
      break;
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

LoadingIndicator.themePath = 'loadingIndicator';

export default themed(LoadingIndicator);
