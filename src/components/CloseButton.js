import React from 'react';
import styled from '@stream-io/styled-components';
import { Image } from 'react-native';
import closeRound from '../images/icons/close-round.png';

export const CloseButton = () => {
  const Container = styled.View`
    width: ${({ theme }) => theme.closeButton.container.width};
    height: ${({ theme }) => theme.closeButton.container.height};
    border-radius: ${({ theme }) => theme.closeButton.container.borderRadius};
    align-items: ${({ theme }) => theme.closeButton.container.alignItems};
    justify-content: ${({ theme }) =>
      theme.closeButton.container.justifyContent};
    background-color: ${({ theme }) =>
      theme.closeButton.container.backgroundColor};
    border: ${({ theme }) => theme.closeButton.container.border};
  `;

  return (
    <Container>
      <Image source={closeRound} />
    </Container>
  );
};
