import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const CircleBan = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
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
        d='M15.3031 15.3031L4.69688 4.69688M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z'
        stroke={color}
        strokeLinecap='round'
        strokeWidth={1.5}
      />
    </Svg>
  );
};

export const BlockUser = (props: IconProps) => <CircleBan {...props} />;
