import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const MessageFlag = ({
  fill,
  height,
  pathFill,
  size,
  stroke,
  width,
  ...rest
}: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg viewBox='0 0 20 20' fill='none' height={height ?? size} width={width ?? size} {...rest}>
      <Path
        d='M3.75 17.5001V4.3751C8.75 0.0446299 12.5 8.70557 17.5 4.3751V13.7501C12.5 18.0806 8.75 9.41963 3.75 13.7501'
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
};
