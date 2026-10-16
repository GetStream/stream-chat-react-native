import React from 'react';
import Svg, { Path, type PathProps, type SvgProps } from 'react-native-svg';

export type IconProps = Partial<SvgProps> &
  Omit<RootPathProps, 'd'> & {
    height?: number;
    width?: number;
  };

export const RootSvg = (props: IconProps) => {
  const { children, height = 24, viewBox = '0 0 24 24', width = 24 } = props;
  return (
    <Svg
      {...{
        height,
        viewBox,
        width,
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
