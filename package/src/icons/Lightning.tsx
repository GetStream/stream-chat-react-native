import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

type Props = IconProps & {
  size: number;
};

export const Lightning = ({ size = 32, ...rest }: Props) => (
  <Svg height={size} viewBox={`0 0 ${size} ${size}`} width={size} {...rest}>
    <Path
      d='M14.8522 28H13.5188L14.8522 18.6667H10.1855C9.01218 18.6667 9.74551 17.6667 9.77218 17.6267C11.4922 14.5867 14.0788 10.0533 17.5322 4H18.8655L17.5322 13.3333H22.2122C22.7455 13.3333 23.0388 13.5867 22.7455 14.2133C17.4788 23.4 14.8522 28 14.8522 28Z'
      {...rest}
    />
  </Svg>
);
