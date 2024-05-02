import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

type Props = IconProps & {
  size: number;
};

export const ArrowLeft = ({ size, ...rest }: Props) => (
  <Svg fill={'none'} height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
    <Path
      d='M6.86621 11.6543C6.875 11.3555 6.98047 11.1006 7.21777 10.8721L14.0732 4.16602C14.2578 3.97266 14.5039 3.87598 14.7852 3.87598C15.3564 3.87598 15.8047 4.31543 15.8047 4.88672C15.8047 5.16797 15.6904 5.42285 15.4971 5.625L9.31836 11.6543L15.4971 17.6836C15.6904 17.877 15.8047 18.1318 15.8047 18.4131C15.8047 18.9932 15.3564 19.4326 14.7852 19.4326C14.5039 19.4326 14.2578 19.3359 14.0732 19.1426L7.21777 12.4365C6.98047 12.208 6.86621 11.9531 6.86621 11.6543Z'
      {...rest}
    />
  </Svg>
);
