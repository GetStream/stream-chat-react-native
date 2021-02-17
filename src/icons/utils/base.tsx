import React from 'react';
import Svg, { Path, PathProps, SvgProps } from 'react-native-svg';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

export type IconProps = Partial<SvgProps> &
  Omit<RootPathProps, 'd'> & {
    height?: number;
    width?: number;
  };

export const RootSvg: React.FC<IconProps> = (props) => {
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

export const RootPath: React.FC<RootPathProps> = (props) => {
  const {
    theme: {
      colors: { black },
    },
  } = useTheme();

  const { d, pathFill = black, pathOpacity } = props;
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
