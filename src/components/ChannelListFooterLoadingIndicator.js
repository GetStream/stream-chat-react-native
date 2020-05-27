import React from 'react';

import styled from '@stream-io/styled-components';
import { Spinner } from './Spinner';

const Container = styled.View`
  width: 100%;
  justify-content: center;
  align-items: center;
  ${({ theme }) => theme.channelListFooterLoadingIndicator.container.css}
`;

export const ChannelListFooterLoadingIndicator = () => (
  <Container>
    <Spinner />
  </Container>
);
