import React from 'react';

import { Spinner } from '../Spinner/Spinner';

import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { styled } from '../../../styles/styledComponents';

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

const LoadingIndicatorWrapper: React.FC<{ text: string }> = ({ text }) => (
  <Container>
    <Spinner />
    <LoadingText testID='loading'>{text}</LoadingText>
  </Container>
);

export type LoadingProps = {
  listType?: 'channel' | 'message' | 'default';
  loadingText?: string;
};

/**
 * UI Component for LoadingIndicator
 *
 * @example ./LoadingIndicator.md
 */
export const LoadingIndicator: React.FC<LoadingProps> = (props) => {
  const { listType, loadingText } = props;

  const { t } = useTranslationContext();

  if (loadingText) {
    return <LoadingIndicatorWrapper text={loadingText} />;
  }

  switch (listType) {
    case 'channel':
      return <LoadingIndicatorWrapper text={t('Loading channels ...')} />;
    case 'message':
      return <LoadingIndicatorWrapper text={t('Loading messages ...')} />;
    default:
      return <LoadingIndicatorWrapper text={t('Loading ...')} />;
  }
};
