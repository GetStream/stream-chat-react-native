import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Bell = ({ height = 16, width = 16, ...rest }: IconProps) => {
  return (
    <Svg height={height} viewBox={'0 0 16 16'} width={width} fill={'none'} {...rest}>
      <Path
        d='M10.6667 11.5007C10.6667 12.9734 9.47273 14.1673 8 14.1673C6.52724 14.1673 5.33333 12.9734 5.33333 11.5007M13.5 10.8301C13.5 11.2004 13.1997 11.5007 12.8294 11.5007H3.17062C2.80025 11.5007 2.5 11.2004 2.5 10.8301C2.5 10.7231 2.52557 10.6177 2.57457 10.5227L3.39922 8.92338C3.48623 8.75465 3.53621 8.56925 3.54578 8.37958L3.66901 5.93996C3.7844 3.63986 5.68924 1.83398 8 1.83398C10.3107 1.83398 12.2156 3.63986 12.331 5.93996L12.4542 8.37958C12.4638 8.56925 12.5137 8.75465 12.6008 8.92338L13.4254 10.5227C13.4744 10.6177 13.5 10.7231 13.5 10.8301Z'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        {...rest}
      />
    </Svg>
  );
};
