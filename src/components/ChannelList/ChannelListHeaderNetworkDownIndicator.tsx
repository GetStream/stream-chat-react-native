import React from 'react';
import { styled } from '../../styles/styledComponents';

import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

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

const ChannelListHeaderNetworkDownIndicator = () => {
  const { t } = useTranslationContext();

  return (
    <Container>
      <ErrorText>{t('Connection failure, reconnecting now ...')}</ErrorText>
    </Container>
  );
};

export default ChannelListHeaderNetworkDownIndicator;
