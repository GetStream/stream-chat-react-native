import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Check = ({ height, size, width, ...rest }: IconProps) => (
  <Svg viewBox={'0 0 20 20'} fill='none' height={height ?? size} width={width ?? size} {...rest}>
    <Path
      d='M3.125 11.25L7.5 15.625L17.5 5.625'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...rest}
    />
  </Svg>
);

export const Tick = (props: IconProps) => <Check {...props} />;
