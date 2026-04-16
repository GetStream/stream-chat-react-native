import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Resend = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg viewBox='0 0 20 20' fill='none' height={height ?? size} width={width ?? size} {...rest}>
      <Path
        d='M14.3751 8.12481H18.1251M18.1251 8.12481V4.37481M18.1251 8.12481L14.8618 5.13809C13.9063 4.18263 12.6904 3.52991 11.3661 3.26151C10.0418 2.9931 8.66771 3.12091 7.41561 3.62896C6.1635 4.137 5.08887 5.00276 4.32599 6.11806C3.5631 7.23336 3.1458 8.54875 3.12621 9.89986C3.10662 11.251 3.48562 12.5779 4.21585 13.7148C4.94609 14.8518 5.99517 15.7483 7.23202 16.2925C8.46887 16.8366 9.83865 17.0042 11.1702 16.7743C12.5018 16.5444 13.736 15.9272 14.7188 14.9998'
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
};
