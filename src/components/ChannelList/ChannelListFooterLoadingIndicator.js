import React from 'react';

import styled from 'styled-components';
import { Spinner } from '../Spinner';

const Container = styled.View`
  width: 100%;
  justify-content: center;
  align-items: center;
  ${({ theme }) => theme.channelListFooterLoadingIndicator.container.css}
`;

const ChannelListFooterLoadingIndicator = () => (
  <Container>
    <Spinner />
  </Container>
);

export default ChannelListFooterLoadingIndicator;
