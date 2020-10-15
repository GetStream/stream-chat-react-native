import React from 'react';

import { Spinner } from '../Spinner/Spinner';

import { styled } from '../../styles/styledComponents';

const Container = styled.View`
  align-items: center;
  justify-content: center;
  width: 100%;
  ${({ theme }) => theme.channelListFooterLoadingIndicator.container.css}
`;

export const ChannelListFooterLoadingIndicator: React.FC = () => (
  <Container>
    <Spinner />
  </Container>
);
