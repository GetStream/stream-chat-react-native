import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Trash = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 20 20'} width={width} {...rest}>
    <Path
      d='M3.95825 5.41666L4.71252 16.1584C4.77382 17.0314 5.49992 17.7083 6.37509 17.7083H13.6248C14.4999 17.7083 15.226 17.0314 15.2873 16.1584L16.0416 5.41666M8.33325 8.74999V13.5417M11.6666 8.74999V13.5417M2.70825 4.79166H17.2916M7.10375 4.6524C7.27558 3.20543 8.50667 2.08333 9.99992 2.08333C11.4932 2.08333 12.7243 3.20543 12.8961 4.6524'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
