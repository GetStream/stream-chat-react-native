import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Stop = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = fill ?? pathFill ?? stroke ?? 'black';

  return (
    <Svg
      fill={'none'}
      height={height ?? size}
      viewBox={'0 0 20 20'}
      width={width ?? size}
      {...rest}
    >
      <Path
        d='M16.875 4.375V15.625C16.875 15.9565 16.7433 16.2745 16.5089 16.5089C16.2745 16.7433 15.9565 16.875 15.625 16.875H4.375C4.04348 16.875 3.72554 16.7433 3.49112 16.5089C3.2567 16.2745 3.125 15.9565 3.125 15.625V4.375C3.125 4.04348 3.2567 3.72554 3.49112 3.49112C3.72554 3.2567 4.04348 3.125 4.375 3.125H15.625C15.9565 3.125 16.2745 3.2567 16.5089 3.49112C16.7433 3.72554 16.875 4.04348 16.875 4.375Z'
        fill={color}
      />
    </Svg>
  );
};
