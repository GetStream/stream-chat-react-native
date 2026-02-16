import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const CircleBan = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 16 16'} width={width} {...rest}>
    <Path
      d='M12.3604 3.64016C11.2445 2.52421 9.70285 1.83398 7.99998 1.83398C4.59423 1.83398 1.83331 4.5949 1.83331 8.00065C1.83331 9.70352 2.52354 11.2452 3.63949 12.3611M12.3604 3.64016C13.4764 4.7561 14.1666 6.29777 14.1666 8.00065C14.1666 11.4064 11.4057 14.1673 7.99998 14.1673C6.2971 14.1673 4.75543 13.4771 3.63949 12.3611M12.3604 3.64016L3.63949 12.3611'
      strokeLinecap='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
