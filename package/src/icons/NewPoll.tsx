import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const NewPoll = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 20 20'} width={width} {...rest}>
    <Path
      d='M7.70833 16.875V11.4583H3.95833C3.4981 11.4583 3.125 11.8314 3.125 12.2917V16.0417C3.125 16.5019 3.4981 16.875 3.95833 16.875H7.70833ZM7.70833 16.875H12.2917M7.70833 16.875V3.95833C7.70833 3.4981 8.08143 3.125 8.54167 3.125H11.4583C11.9186 3.125 12.2917 3.4981 12.2917 3.95833V16.875M12.2917 16.875H16.4583C16.6884 16.875 16.875 16.6884 16.875 16.4583V8.125C16.875 7.66477 16.5019 7.29167 16.0417 7.29167H12.2917V16.875Z'
      strokeLinecap='square'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
