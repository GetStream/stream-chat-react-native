import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from '../utils/base';

export const UserSearch: React.FC<IconProps> = ({ height = 20, width = 20, ...rest }) => {
  return (
    <Svg fill='none' height={height} viewBox={`0 0 20 20`} width={width}>
      <Path
        d='M16.875 16.875L13.4387 13.4387M13.4387 13.4387C14.5321 12.3454 15.2083 10.835 15.2083 9.16667C15.2083 5.82995 12.5034 3.125 9.16667 3.125C5.82995 3.125 3.125 5.82995 3.125 9.16667C3.125 12.5034 5.82995 15.2083 9.16667 15.2083C10.835 15.2083 12.3454 14.5321 13.4387 13.4387Z'
        strokeWidth={1.5}
        strokeLinejoin='round'
        strokeLinecap='round'
        {...rest}
      />
    </Svg>
  );
};
