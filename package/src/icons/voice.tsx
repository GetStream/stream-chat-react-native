import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Mic = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
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
        d='M10 15.625V18.75M10 15.625C11.4918 15.625 12.9226 15.0324 13.9775 13.9775C15.0324 12.9226 15.625 11.4918 15.625 10M10 15.625C8.50816 15.625 7.07742 15.0324 6.02252 13.9775C4.96763 12.9226 4.375 11.4918 4.375 10M10 1.875C11.7259 1.875 13.125 3.27411 13.125 5V10C13.125 11.7259 11.7259 13.125 10 13.125C8.27411 13.125 6.875 11.7259 6.875 10V5C6.875 3.27411 8.27411 1.875 10 1.875Z'
        stroke={color}
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
      />
    </Svg>
  );
};
