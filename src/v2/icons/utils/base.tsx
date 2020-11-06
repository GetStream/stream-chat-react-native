import React from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, PathProps, SvgProps } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export type IconProps = Partial<SvgProps> &
  Omit<RootPathProps, 'd'> & {
    backgroundFill?: SvgProps['fill'];
    height?: number;
    width?: number;
  };

export const RootSvg: React.FC<IconProps> = (props) => {
  const {
    backgroundFill = 'none',
    children,
    height = 24,
    onPress,
    viewBox = '0 0 24 24',
    width = 24,
  } = props;
  const animatedProps = useAnimatedProps(() => ({
    fill: backgroundFill,
    height,
    onPress,
    viewBox,
    width,
  }));
  return (
    <AnimatedSvg animatedProps={animatedProps} {...props}>
      {children}
    </AnimatedSvg>
  );
};

export type RootPathProps = {
  d: PathProps['d'];
  pathFill?: SvgProps['fill'];
  pathOpacity?: PathProps['opacity'];
};

export const RootPath: React.FC<RootPathProps> = (props) => {
  const { d, pathFill = '#000000', pathOpacity } = props;
  const animatedProps = useAnimatedProps(() => ({
    clipRule: 'evenodd',
    d,
    fill: pathFill,
    fillRule: 'evenodd',
    opacity: pathOpacity,
  }));
  return <AnimatedPath animatedProps={animatedProps} />;
};
