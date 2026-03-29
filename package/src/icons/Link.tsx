import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Link = ({ height, size, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height ?? size} viewBox={'0 0 20 20'} width={width ?? size} {...rest}>
    <Path
      d='M7.49989 12.4999L12.4999 7.49989M8.74989 5.94598L11.0983 3.60223C11.8035 2.90843 12.7543 2.52139 13.7436 2.52542C14.7328 2.52945 15.6804 2.92422 16.3799 3.62374C17.0795 4.32326 17.4742 5.27086 17.4783 6.26012C17.4823 7.24938 17.0953 8.20016 16.4015 8.90536L14.053 11.2499M5.94598 8.74989L3.60223 11.0983C2.90843 11.8035 2.52139 12.7543 2.52542 13.7436C2.52945 14.7328 2.92422 15.6804 3.62374 16.3799C4.32326 17.0795 5.27086 17.4742 6.26012 17.4783C7.24938 17.4823 8.20016 17.0953 8.90536 16.4015L11.2499 14.053'
      strokeLinejoin='round'
      strokeWidth={1.2}
      {...rest}
    />
  </Svg>
);
