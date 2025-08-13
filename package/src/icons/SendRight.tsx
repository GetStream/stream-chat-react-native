import React from 'react';

import Svg, { Circle, Path } from 'react-native-svg';

import { IconProps } from './utils/base';

type Props = IconProps & {
  size: number;
};

export const SendRight = ({ size, ...rest }: Props) => (
  <Svg height={size} viewBox={`0 0 ${size} ${size}`} width={size} {...rest} testID='send-right'>
    <Circle cx={size / 2} cy={size / 2} r={size / 2} {...rest} />
    <Path
      clipRule='evenodd'
      d='M9.33398 14.6666H16.0007V9.33325L22.6673 15.9999L16.0007 22.6666V17.3333H9.33398V14.6666Z'
      fill={'white'}
      fillRule='evenodd'
    />
  </Svg>
);
