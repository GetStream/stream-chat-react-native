import React, { useContext } from 'react';

import Spinner from '../Spinner/Spinner';

import { TranslationContext } from '../../context';
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

type Props = {
  listType?: 'channel' | 'message' | 'default';
  loadingText?: string;
};

/**
 * UI Component for LoadingIndicator
 *
 * @example ../docs/LoadingIndicator.md
 */
const LoadingIndicator: React.FC<Props> & { themePath: string } = ({
  listType,
  loadingText,
}) => {
  const { t } = useContext(TranslationContext);
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
