import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const SendRight = ({ height, width, ...rest }: IconProps) => (
  <Svg
    fill={'none'}
    height={height}
    viewBox={`0 0 20 20`}
    width={width}
    {...rest}
    testID='send-right'
  >
    <Path
      d='M4.99998 9.99996H7.70832M4.99998 9.99996L2.81076 4.05778C2.54973 3.34929 3.29006 2.68668 3.96538 3.02433L16.4259 9.25463C17.0402 9.56171 17.0402 10.4382 16.4259 10.7453L3.96538 16.9756C3.29006 17.3133 2.54973 16.6506 2.81076 15.9421L4.99998 9.99996Z'
      {...rest}
    />
  </Svg>
);
