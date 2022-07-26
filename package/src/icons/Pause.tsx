import React from 'react';
import { Rect } from 'react-native-svg';

import { IconProps, RootSvg } from './utils/base';

export const Pause: React.FC<IconProps> = (props) => {
  const { height, width } = props;
  return (
    <RootSvg height={height} viewBox={`0 0 ${height} ${width}`} width={width} {...props}>
      <Rect fill={props.pathFill} height={14} width={4} x={6} y={5} />
      <Rect fill={props.pathFill} height={14} width={4} x={14} y={5} />
    </RootSvg>
  );
};
