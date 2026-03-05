import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const ImageGrid = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 16 16'} width={width} {...rest}>
    <Path
      d='M2.5 4.63333C2.5 3.8866 2.5 3.51323 2.64533 3.22801C2.77315 2.97713 2.97713 2.77315 3.22801 2.64533C3.51323 2.5 3.8866 2.5 4.63333 2.5H6.83333V6.83333H2.5V4.63333Z'
      strokeLinejoin='round'
      strokeLinecap='round'
      strokeWidth={1.2}
      {...rest}
    />
    <Path
      d='M9.16667 2.5H11.3667C12.1134 2.5 12.4868 2.5 12.772 2.64533C13.0229 2.77315 13.2269 2.97713 13.3547 3.22801C13.5 3.51323 13.5 3.8866 13.5 4.63333V6.83333H9.16667V2.5Z'
      strokeLinejoin='round'
      strokeLinecap='round'
      strokeWidth={1.2}
      {...rest}
    />
    <Path
      d='M2.5 9.16667H6.83333V13.5H4.63333C3.8866 13.5 3.51323 13.5 3.22801 13.3547C2.97713 13.2269 2.77315 13.0229 2.64533 12.772C2.5 12.4868 2.5 12.1134 2.5 11.3667V9.16667Z'
      strokeLinejoin='round'
      strokeLinecap='round'
      strokeWidth={1.2}
      {...rest}
    />
    <Path
      d='M9.16667 9.16667H13.5V11.3667C13.5 12.1134 13.5 12.4868 13.3547 12.772C13.2269 13.0229 13.0229 13.2269 12.772 13.3547C12.4868 13.5 12.1134 13.5 11.3667 13.5H9.16667V9.16667Z'
      strokeLinejoin='round'
      strokeLinecap='round'
      strokeWidth={1.2}
      {...rest}
    />
  </Svg>
);
