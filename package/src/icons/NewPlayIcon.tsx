import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const NewPlayIcon = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={`0 0 10 10`} width={width} {...rest}>
    <Path
      d='M3.8518 0.986492C3.08941 0.493175 2.0835 1.04042 2.0835 1.9485V8.05158C2.0835 8.95967 3.08941 9.50692 3.8518 9.01358L8.56783 5.96204C9.26562 5.51054 9.26566 4.48958 8.56783 4.03804L3.8518 0.986492Z'
      {...rest}
    />
  </Svg>
);
