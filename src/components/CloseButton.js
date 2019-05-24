import React from 'react';
import styled from '@stream-io/styled-components';
import { Image } from 'react-native';
import closeRound from '../images/icons/close-round.png';
import { getTheme } from '../styles/theme';

export const CloseButton = () => {
  const Container = styled.View`
    width: ${(props) => getTheme(props).closeButton.container.width};
    height: ${(props) => getTheme(props).closeButton.container.height};
    border-radius: ${(props) =>
      getTheme(props).closeButton.container.borderRadius};
    align-items: ${(props) => getTheme(props).closeButton.container.alignItems};
    justify-content: ${(props) =>
      getTheme(props).closeButton.container.justifyContent};
    background-color: ${(props) =>
      getTheme(props).closeButton.container.backgroundColor};
    border: ${(props) => getTheme(props).closeButton.container.border};
  `;

  return (
    <Container>
      <Image source={closeRound} />
    </Container>
  );
};
