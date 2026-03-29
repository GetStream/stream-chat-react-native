import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Pause = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
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
        d='M13.75 4.375H11.875C11.5298 4.375 11.25 4.65482 11.25 5V15C11.25 15.3452 11.5298 15.625 11.875 15.625H13.75C14.0952 15.625 14.375 15.3452 14.375 15V5C14.375 4.65482 14.0952 4.375 13.75 4.375ZM8.125 4.375H6.25C5.90482 4.375 5.625 4.65482 5.625 5V15C5.625 15.3452 5.90482 15.625 6.25 15.625H8.125C8.47018 15.625 8.75 15.3452 8.75 15V5C8.75 4.65482 8.47018 4.375 8.125 4.375Z'
        fill={color}
      />
    </Svg>
  );
};
