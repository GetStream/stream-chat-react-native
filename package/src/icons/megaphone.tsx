import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Megaphone = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg
      fill={'none'}
      height={height ?? size}
      viewBox={`0 0 24 24`}
      width={width ?? size}
      {...rest}
    >
      <Path
        d='M3 11C3 10.4477 3.44772 10 4 10H6L13.5 5V19L6 14H4C3.44772 14 3 13.5523 3 13V11Z'
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <Path
        d='M17 8C17.6275 8.5026 18.1348 9.14079 18.4836 9.86737C18.8323 10.5939 19.0136 11.3905 19.0136 12.1975C19.0136 13.0046 18.8323 13.8012 18.4836 14.5277C18.1348 15.2543 17.6275 15.8925 17 16.3951'
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
};
