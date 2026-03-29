import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Cross = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg
      fill={'none'}
      height={height ?? size}
      viewBox={'0 0 16 16'}
      width={width ?? size}
      {...rest}
    >
      <Path
        d='M4.1665 4.1665L11.8332 11.8332M11.8332 4.1665L4.1665 11.8332'
        stroke={color}
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
      />
    </Svg>
  );
};
