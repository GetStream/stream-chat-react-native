import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Lock = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg
      fill={'none'}
      height={height ?? size}
      viewBox={'0 0 20 20'}
      width={width ?? size}
      {...rest}
    >
      <Path
        d='M16.25 6.875H3.75C3.40482 6.875 3.125 7.15482 3.125 7.5V16.25C3.125 16.5952 3.40482 16.875 3.75 16.875H16.25C16.5952 16.875 16.875 16.5952 16.875 16.25V7.5C16.875 7.15482 16.5952 6.875 16.25 6.875Z'
        fill='none'
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <Path
        d='M10 12.8125C10.5178 12.8125 10.9375 12.3928 10.9375 11.875C10.9375 11.3572 10.5178 10.9375 10 10.9375C9.48223 10.9375 9.0625 11.3572 9.0625 11.875C9.0625 12.3928 9.48223 12.8125 10 12.8125Z'
        fill={color}
      />
      <Path
        d='M6.875 6.875V4.375C6.875 3.5462 7.20424 2.75134 7.79029 2.16529C8.37634 1.57924 9.1712 1.25 10 1.25C10.8288 1.25 11.6237 1.57924 12.2097 2.16529C12.7958 2.75134 13.125 3.5462 13.125 4.375V6.875'
        fill='none'
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
};
