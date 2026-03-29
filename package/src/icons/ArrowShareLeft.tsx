import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const ArrowShareLeft = ({
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
    <Svg
      fill={'none'}
      height={height ?? size}
      viewBox={'0 0 20 20'}
      width={width ?? size}
      {...rest}
    >
      <Path
        d='M17.5812 15.525C16.2953 14.1555 12.9195 11.25 8.12265 11.25V15L1.87265 8.75L8.12265 2.5V6.25C12.2476 6.25 17.5359 10.1914 18.1226 15.2766C18.1308 15.3424 18.1177 15.4091 18.0854 15.4671C18.0531 15.525 18.0031 15.5712 17.9428 15.5988C17.8825 15.6265 17.815 15.6343 17.75 15.621C17.685 15.6077 17.6259 15.5741 17.5812 15.525Z'
        stroke={color}
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
      />
    </Svg>
  );
};
