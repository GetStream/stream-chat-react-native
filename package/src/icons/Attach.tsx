import React from 'react';

import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { IconProps } from './utils/base';

type Props = IconProps & {
  size: number;
};

export const Attach = ({ size, ...rest }: Props) => (
  <Svg height={size} viewBox={`0 0 ${size} ${size}`} width={size} {...rest}>
    <G clipPath='url(#id)'>
      <Path
        d='M17.5245 9.33332L14.8579 9.33332L14.8579 14.6666L9.52453 14.6666L9.52453 17.3333L14.8579 17.3333L14.8579 22.6667L17.5245 22.6667L17.5245 17.3333L22.8579 17.3333L22.8579 14.6666L17.5245 14.6666L17.5245 9.33332ZM16.1912 2.66665C8.83119 2.66665 2.85786 8.63998 2.85786 16C2.85786 23.36 8.83119 29.3333 16.1912 29.3333C23.5512 29.3333 29.5245 23.36 29.5245 16C29.5245 8.63998 23.5512 2.66665 16.1912 2.66665ZM16.1912 26.6667C10.3112 26.6666 5.52453 21.88 5.52453 16C5.52453 10.12 10.3112 5.33332 16.1912 5.33332C22.0712 5.33332 26.8579 10.12 26.8579 16C26.8579 21.88 22.0712 26.6666 16.1912 26.6667Z'
        {...rest}
      />
    </G>
    <Defs>
      <ClipPath id='id'>
        <Rect height={32} transform={'translate(0.191406)'} width={size} />
      </ClipPath>
    </Defs>
  </Svg>
);
