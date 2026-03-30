import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Share = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 20 20'} width={width} {...rest}>
    <Path
      d='M11.6477 5.72656L7.10234 8.64844M7.10234 11.3516L11.6477 14.2734M7.5 10C7.5 11.3807 6.38071 12.5 5 12.5C3.61929 12.5 2.5 11.3807 2.5 10C2.5 8.61929 3.61929 7.5 5 7.5C6.38071 7.5 7.5 8.61929 7.5 10ZM16.25 15.625C16.25 17.0057 15.1307 18.125 13.75 18.125C12.3693 18.125 11.25 17.0057 11.25 15.625C11.25 14.2443 12.3693 13.125 13.75 13.125C15.1307 13.125 16.25 14.2443 16.25 15.625ZM16.25 4.375C16.25 5.75571 15.1307 6.875 13.75 6.875C12.3693 6.875 11.25 5.75571 11.25 4.375C11.25 2.99429 12.3693 1.875 13.75 1.875C15.1307 1.875 16.25 2.99429 16.25 4.375Z'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...rest}
    />
  </Svg>
);
