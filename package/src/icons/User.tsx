import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const User = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = pathFill ?? fill ?? stroke ?? 'black';

  return (
    <Svg fill='none' height={height ?? size} viewBox='0 0 24 24' width={width ?? size} {...rest}>
      <Path
        d='M10 12.5C12.7614 12.5 15 10.2614 15 7.5C15 4.73858 12.7614 2.5 10 2.5C7.23858 2.5 5 4.73858 5 7.5C5 10.2614 7.23858 12.5 10 12.5ZM10 12.5C6.76172 12.5 4.01328 14.2602 2.5 16.875M10 12.5C13.2383 12.5 15.9867 14.2602 17.5 16.875'
        fill='none'
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
};
