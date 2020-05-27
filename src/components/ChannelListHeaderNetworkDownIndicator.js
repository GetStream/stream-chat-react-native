import React from 'react';
import styled from '@stream-io/styled-components';
import { withTranslationContext } from '../context';

const Container = styled.View`
  width: 100%;
  align-items: center;
  justify-content: center;
  background-color: #fae6e8;
  ${({ theme }) => theme.channelListHeaderErrorIndicator.container.css}
`;

const ErrorText = styled.Text`
  color: red;
  font-size: 12;
  font-weight: bold;
  padding: 3px;
  ${({ theme }) => theme.channelListHeaderErrorIndicator.errorText.css}
`;

export const ChannelListHeaderNetworkDownIndicator = withTranslationContext(
  ({ t }) => (
    <Container>
      <ErrorText>{t('Connection failure, reconnecting now ...')}</ErrorText>
    </Container>
  ),
);
