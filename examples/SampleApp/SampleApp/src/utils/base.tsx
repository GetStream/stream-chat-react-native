import React from 'react';
import Svg, { Path, PathProps, SvgProps } from 'react-native-svg';
import { useTheme } from 'stream-chat-react-native';

export type IconProps = Partial<SvgProps> &
  Omit<RootPathProps, 'd'> & {
    active?: boolean;
    backgroundFill?: SvgProps['fill'];
    dark?: boolean;
    height?: number;
    width?: number;
  };
export const RootSvg: React.FC<IconProps> = (props) => {
  const { backgroundFill = 'none', children, height = 24, width = 24 } = props;
  return (
    <Svg fill={backgroundFill} height={height} viewBox='0 0 24 24' width={width} {...props}>
      {children}
    </Svg>
  );
};
export type RootPathProps = {
  d: PathProps['d'];
  pathFill?: SvgProps['fill'];
  pathOpacity?: PathProps['opacity'];
};
export const RootPath: React.FC<RootPathProps> = (props) => {
  const {
    theme: {
      colors: { black },
    },
  } = useTheme();

  const { d, pathFill = black, pathOpacity } = props;
  return <Path clipRule='evenodd' d={d} fill={pathFill} fillRule='evenodd' opacity={pathOpacity} />;
};
