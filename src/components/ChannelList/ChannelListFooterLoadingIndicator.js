import React from 'react';
import styled from '@stream-io/styled-components';

import Spinner from '../Spinner/Spinner';

const Container = styled.View`
  align-items: center;
  justify-content: center;
  width: 100%;
  ${({ theme }) => theme.channelListFooterLoadingIndicator.container.css}
`;

const ChannelListFooterLoadingIndicator = () => (
  <Container>
    <Spinner />
  </Container>
);

export default ChannelListFooterLoadingIndicator;
