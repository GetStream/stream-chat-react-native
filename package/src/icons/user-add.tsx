import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const UserAdd = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg viewBox='0 0 20 20' fill='none' height={height ?? size} width={width ?? size} {...rest}>
      <Path
        d='M15.625 10.625H19.375M17.5 8.75V12.5M8.4375 12.5C11.0263 12.5 13.125 10.4013 13.125 7.8125C13.125 5.22367 11.0263 3.125 8.4375 3.125C5.84867 3.125 3.75 5.22367 3.75 7.8125C3.75 10.4013 5.84867 12.5 8.4375 12.5ZM8.4375 12.5C5.74688 12.5 3.48047 13.7148 1.875 15.625M8.4375 12.5C11.1281 12.5 13.3945 13.7148 15 15.625'
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
};
