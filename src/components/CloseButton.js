import React from 'react';
import styled from '@stream-io/styled-components';
import { themed } from '../styles/theme';
import { Image } from 'react-native';
import closeRound from '../images/icons/close-round.png';

const Container = styled.View`
  width: 30;
  height: 30;
  border-radius: 3;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  ${({ theme }) => theme.closeButton.container.extra}
`;

export const CloseButton = themed(
  class CloseButton extends React.PureComponent {
    static themePath = 'closeButton';
    render() {
      return (
        <Container>
          <Image source={closeRound} />
        </Container>
      );
    }
  },
);
