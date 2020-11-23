import React from 'react';

import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { styled } from '../../styles/styledComponents';

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

type LoadingErrorWrapperProps = {
  text: string;
  onPress?: () => void;
};

const LoadingErrorWrapper: React.FC<LoadingErrorWrapperProps> = (props) => {
  const { children, onPress, text } = props;

  return (
    <Container onPress={onPress}>
      <ErrorText testID='loading-error'>{text}</ErrorText>
      {children}
    </Container>
  );
};

export type LoadingErrorProps = {
  error?: boolean;
  listType?: 'channel' | 'message' | 'default';
  loadNextPage?: () => Promise<void>;
  retry?: () => Promise<void> | void;
};

export const LoadingErrorIndicator: React.FC<LoadingErrorProps> = (props) => {
  const { listType, retry = () => null } = props;

  const { t } = useTranslationContext();

  switch (listType) {
    case 'channel':
      return (
        <LoadingErrorWrapper
          onPress={retry}
          text={t('Error loading channel list...')}
        >
          <RetryText>⟳</RetryText>
        </LoadingErrorWrapper>
      );
    case 'message':
      return (
        <LoadingErrorWrapper
          onPress={retry}
          text={t('Error loading messages for this channel...')}
        />
      );
    default:
      return <LoadingErrorWrapper text={t('Error loading')} />;
  }
};
