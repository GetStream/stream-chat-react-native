import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const MessageBubbleEmpty = ({ height, width, ...props }: IconProps) => (
  <Svg height={height} width={width} fill={'none'} viewBox='0 0 27 25' {...props}>
    <Path
      d='M20.0805 14.75H22.7501C24.2227 14.75 25.4167 13.5561 25.4167 12.0833V3.41667C25.4167 1.94391 24.2227 0.75 22.7501 0.75H9.08333C7.61057 0.75 6.41667 1.94391 6.41667 3.41667V6.08333M3.41667 6.08333H17.4167C18.8894 6.08333 20.0834 7.27724 20.0834 8.75V17.4167C20.0834 18.8895 18.8894 20.0833 17.4167 20.0833H11.0834L5.08333 23.4167V20.0833H3.41667C1.94391 20.0833 0.75 18.8895 0.75 17.4167V8.75C0.75 7.27724 1.94391 6.08333 3.41667 6.08333Z'
      strokeLinejoin='round'
      strokeLinecap='round'
      strokeWidth={1.5}
      {...props}
    />
  </Svg>
);
