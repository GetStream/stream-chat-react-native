import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

type Props = IconProps & {
  size: number;
};

export const GiphyLightning = ({ size = 16, ...rest }: Props) => (
  <Svg height={size} viewBox={`0 0 ${size} ${size}`} width={size} {...rest}>
    <Path
      d='M7.69693 2H11.3333L8.90905 6.84848H11.3333L6.78784 15.3333L7.69693 9.27273H4.66663L7.69693 2Z'
      {...rest}
    />
  </Svg>
);
