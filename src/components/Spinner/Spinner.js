import React from 'react';
import { View, Animated, Easing } from 'react-native';
import styled from '@stream-io/styled-components';
import { themed } from '../../styles/theme';

const AnimatedView = Animated.createAnimatedComponent(View);

export const Circle = styled(AnimatedView)`
  height: 30px;
  width: 30px;
  margin: 5px;
  border-width: 2px;
  border-radius: 30px;
  justify-content: center;
  border-color: ${({ theme }) => theme.colors.primary};
  border-right-color: transparent;
  ${({ theme }) => theme.spinner.css}
`;
/**
 * @example ../docs/Spinner.md
 * @extends PureComponent
 */
class Spinner extends React.PureComponent {
  static themePath = 'spinner';
  state = {
    rotateValue: new Animated.Value(0),
  };

  componentDidMount() {
    this._start();
  }

  _start = () => {
    Animated.loop(
      Animated.timing(this.state.rotateValue, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  };

  render() {
    return (
      <Circle
        style={{
          transform: [
            {
              rotate: this.state.rotateValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        }}
      />
    );
  }
}

export default themed(Spinner);
