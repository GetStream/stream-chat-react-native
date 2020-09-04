import React from 'react';
import { Image } from 'react-native';
import styled from 'styled-components';

import closeRound from '../../images/icons/close-round.png';
import { themed } from '../../styles/theme';

const Container = styled.View`
  align-items: center;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  height: 30px;
  justify-content: center;
  width: 30px;
  ${({ theme }) => theme.closeButton.container.css}
`;

const CloseButton = () => (
  <Container>
    <Image source={closeRound} testID='close-button' />
  </Container>
);

CloseButton.themePath = 'closeButton';

export default themed(CloseButton);
