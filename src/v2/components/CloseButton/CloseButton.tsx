import React from 'react';
import { Image } from 'react-native';

import { styled } from '../../../styles/styledComponents';

const Container = styled.View`
  align-items: center;
  background-color: white;
  border-color: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  border-style: solid;
  border-width: 1px;
  height: 30px;
  justify-content: center;
  width: 30px;
  ${({ theme }) => theme.closeButton.container.css}
`;

export const CloseButton: React.FC = () => (
  <Container>
    <Image
      source={require('../../../images/icons/close-round.png')}
      testID='close-button'
    />
  </Container>
);
