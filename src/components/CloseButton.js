import React from 'react';
import styled from '@stream-io/styled-components';
import { Image } from 'react-native';
import closeRound from '../images/icons/close-round.png';

export const CloseButton = () => {
  const Container = styled.View`
    width: ${(props) => props.theme.closeButton.container.width};
    height: ${(props) => props.theme.closeButton.container.height};
    border-radius: ${(props) => props.theme.closeButton.container.borderRadius};
    align-items: ${(props) => props.theme.closeButton.container.alignItems};
    justify-content: ${(props) =>
      props.theme.closeButton.container.justifyContent};
    background-color: ${(props) =>
      props.theme.closeButton.container.backgroundColor};
    border: ${(props) => props.theme.closeButton.container.border};
  `;

  return (
    <Container>
      <Image source={closeRound} />
    </Container>
  );
};
