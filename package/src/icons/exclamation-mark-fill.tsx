import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Exclamation = ({
  fill,
  height,
  pathFill,
  size,
  stroke,
  width,
  ...rest
}: IconProps) => {
  const color = pathFill ?? fill ?? stroke ?? 'black';

  return (
    <Svg
      fill={'none'}
      height={height ?? size}
      viewBox={'0 0 20 20'}
      width={width ?? size}
      {...rest}
    >
      <Path
        d='M10 16.875C10.6904 16.875 11.25 16.3154 11.25 15.625C11.25 14.9346 10.6904 14.375 10 14.375C9.30964 14.375 8.75 14.9346 8.75 15.625C8.75 16.3154 9.30964 16.875 10 16.875Z'
        fill={color}
      />
      <Path
        d='M9 11.875V3.75C9 3.19772 9.44772 2.75 10 2.75C10.5523 2.75 11 3.19772 11 3.75V11.875C11 12.4273 10.5523 12.875 10 12.875C9.44772 12.875 9 12.4273 9 11.875Z'
        fill={color}
      />
    </Svg>
  );
};
