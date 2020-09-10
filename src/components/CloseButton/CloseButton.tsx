import React from 'react';
import { Image } from 'react-native';

import { styled } from '../../styles/styledComponents';
import { themed } from '../../styles/theme';

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

const CloseButton: React.FC & { themePath: string } = () => (
  <Container>
    <Image
      source={require('../../images/icons/close-round.png')}
      testID='close-button'
    />
  </Container>
);

CloseButton.themePath = 'closeButton';

export default themed(CloseButton);
