import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const PhotoIcon = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg
      fill={'none'}
      height={height ?? size}
      viewBox={`0 0 20 20`}
      width={width ?? size}
      {...rest}
    >
      <Path
        d='M4.42891 16.875L12.9953 8.30781C13.0534 8.2497 13.1223 8.2036 13.1982 8.17215C13.274 8.1407 13.3554 8.12451 13.4375 8.12451C13.5196 8.12451 13.601 8.1407 13.6768 8.17215C13.7527 8.2036 13.8216 8.2497 13.8797 8.30781L16.875 11.3039M3.75 3.125H16.25C16.5952 3.125 16.875 3.40482 16.875 3.75V16.25C16.875 16.5952 16.5952 16.875 16.25 16.875H3.75C3.40482 16.875 3.125 16.5952 3.125 16.25V3.75C3.125 3.40482 3.40482 3.125 3.75 3.125ZM8.75 7.5C8.75 8.19036 8.19036 8.75 7.5 8.75C6.80964 8.75 6.25 8.19036 6.25 7.5C6.25 6.80964 6.80964 6.25 7.5 6.25C8.19036 6.25 8.75 6.80964 8.75 7.5Z'
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
};
