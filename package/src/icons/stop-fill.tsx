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
        d='M14.375 4.375H5.625C4.93464 4.375 4.375 4.93464 4.375 5.625V14.375C4.375 15.0654 4.93464 15.625 5.625 15.625H14.375C15.0654 15.625 15.625 15.0654 15.625 14.375V5.625C15.625 4.93464 15.0654 4.375 14.375 4.375Z'
        fill={color}
      />
    </Svg>
  );
};
