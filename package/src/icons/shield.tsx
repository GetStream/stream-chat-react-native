import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Shield = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
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
        d='M12 3L4 6V12C4 16.4 7.6 20.4 12 21.5C16.4 20.4 20 16.4 20 12V6L12 3Z'
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
};
