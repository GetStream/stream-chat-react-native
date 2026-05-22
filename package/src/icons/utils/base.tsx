import React from 'react';
import Svg, { Path, PathProps, SvgProps } from 'react-native-svg';

export type IconProps = Partial<SvgProps> &
  Omit<RootPathProps, 'd'> & {
    height?: number;
    width?: number;
    size?: number;
  };

export const RootSvg = (props: IconProps) => {
  const { children, height, size, viewBox = '0 0 24 24', width } = props;
  return (
    <Svg
      {...{
        height: height ?? size ?? 24,
        viewBox,
        width: width ?? size ?? 24,
      }}
      {...props}
    >
      {children}
    </Svg>
  );
};

export type RootPathProps = Pick<PathProps, 'd'> & {
  pathFill?: SvgProps['fill'];
  pathOpacity?: PathProps['opacity'];
};

export const RootPath = (props: RootPathProps) => {
  const { d, pathFill = 'black', pathOpacity } = props;
  return (
    <Path
      {...{
        clipRule: 'evenodd',
        d,
        fill: pathFill,
        fillRule: 'evenodd',
        opacity: pathOpacity,
      }}
    />
  );
};
