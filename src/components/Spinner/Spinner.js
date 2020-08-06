import React, { useEffect } from 'react';
import { Animated, Easing, View } from 'react-native';
import styled from '@stream-io/styled-components';

import { themed } from '../../styles/theme';

const AnimatedView = Animated.createAnimatedComponent(View);

export const Circle = styled(AnimatedView)`
  border-color: ${({ theme }) => theme.colors.primary};
  border-radius: 30px;
  border-right-color: transparent;
  border-width: 2px;
  height: 30px;
  justify-content: center;
  margin: 5px;
  width: 30px;
  ${({ theme }) => theme.spinner.css}
`;

/**
 * @example ../docs/Spinner.md
 */
const Spinner = () => {
  const rotateValue = new Animated.Value(0);

  const startSpinning = () => {
    Animated.loop(
      Animated.timing(rotateValue, {
        duration: 800,
        easing: Easing.linear,
        toValue: 1,
        useNativeDriver: true,
      }),
    ).start();
  };

  useEffect(() => startSpinning());

  return (
    <Circle
      style={{
        transform: [
          {
            rotate: rotateValue.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            }),
          },
        ],
      }}
    />
  );
};

Spinner.themePath = 'spinner';

export default themed(Spinner);
