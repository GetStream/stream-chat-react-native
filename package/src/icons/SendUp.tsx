import React from 'react';

import Svg, { Circle, Path } from 'react-native-svg';

import { IconProps } from './utils/base';

type Props = IconProps & {
  size: number;
};

export const SendUp = ({ size, ...rest }: Props) => (
  <Svg height={size} viewBox={`0 0 ${size} ${size}`} width={size} {...rest} testID='send-up'>
    <Circle cx={size / 2} cy={size / 2} r={size / 2} {...rest} />
    <Path
      clipRule='evenodd'
      d='M14.6673 16V22.6667H17.334V16H22.6673L16.0007 9.33337L9.33398 16H14.6673Z'
      fill={'white'}
      fillRule='evenodd'
    />
  </Svg>
);
