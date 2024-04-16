import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { ColorValue } from 'react-native/types';

type Props = {
  color: ColorValue;
  size: number;
};

export const ArrowUp = ({ color, size }: Props) => (
  <Svg fill={'none'} height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
    <Path
      d='M16 11.0601L8 19.0601L9.88 20.9401L16 14.8334L22.12 20.9401L24 19.0601L16 11.0601Z'
      fill={color}
    />
  </Svg>
);
