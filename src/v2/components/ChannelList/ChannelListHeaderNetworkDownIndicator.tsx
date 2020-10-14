import React from 'react';

import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { styled } from '../../../styles/styledComponents';

const Container = styled.View`
  align-items: center;
  background-color: #fae6e8;
  justify-content: center;
  padding: 3px;
  width: 100%;
  ${({ theme }) => theme.channelListHeaderErrorIndicator.container.css}
`;

const ErrorText = styled.Text`
  color: red;
  font-size: 12px;
  font-weight: bold;
  padding: 3px;
  ${({ theme }) => theme.channelListHeaderErrorIndicator.errorText.css}
`;

export const ChannelListHeaderNetworkDownIndicator: React.FC = () => {
  const { t } = useTranslationContext();

  return (
    <Container>
      <ErrorText>{t('Connection failure, reconnecting now ...')}</ErrorText>
    </Container>
  );
};
