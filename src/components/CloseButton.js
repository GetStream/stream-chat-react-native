import React from 'react';
import styled from 'styled-components';
import { Image } from 'react-native';
import closeRound from '../images/icons/close-round.png';

export const CloseButton = () => {
  const Container = styled.View`
    width: 30px;
    height: 30px;
    border-radius: 3px;
    align-items: center;
    justify-content: center;
    background-color: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
  `;

  return (
    <Container>
      <Image source={closeRound} />
    </Container>
  );
};
