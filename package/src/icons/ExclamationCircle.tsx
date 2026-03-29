import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const ExclamationCircle = ({
  fill,
  height,
  pathFill,
  size,
  stroke,
  width,
  ...rest
}: IconProps) => {
  const color = fill ?? stroke ?? pathFill ?? 'black';

  return (
    <Svg
      fill={'none'}
      height={height ?? size}
      viewBox={'0 0 20 20'}
      width={width ?? size}
      {...rest}
    >
      <Path
        d='M16.75 10C16.75 6.27208 13.7279 3.25 10 3.25C6.27208 3.25 3.25 6.27208 3.25 10C3.25 13.7279 6.27208 16.75 10 16.75C13.7279 16.75 16.75 13.7279 16.75 10ZM18.25 10C18.25 14.5563 14.5563 18.25 10 18.25C5.44365 18.25 1.75 14.5563 1.75 10C1.75 5.44365 5.44365 1.75 10 1.75C14.5563 1.75 18.25 5.44365 18.25 10Z'
        fill={color}
      />
      <Path
        d='M9.25 10.625V6.25C9.25 5.83579 9.58579 5.5 10 5.5C10.4142 5.5 10.75 5.83579 10.75 6.25V10.625C10.75 11.0392 10.4142 11.375 10 11.375C9.58579 11.375 9.25 11.0392 9.25 10.625Z'
        fill={color}
      />
      <Path
        d='M10 14.375C10.5178 14.375 10.9375 13.9553 10.9375 13.4375C10.9375 12.9197 10.5178 12.5 10 12.5C9.48223 12.5 9.0625 12.9197 9.0625 13.4375C9.0625 13.9553 9.48223 14.375 10 14.375Z'
        fill={color}
      />
    </Svg>
  );
};
