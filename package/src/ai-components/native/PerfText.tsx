import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import PerfTextNative, {
  type ColorRange as NativeColorRange,
} from '../native-specs/PerfTextNativeComponent';
import type { ColorRange } from '../syntax-highlighting';

export type PerfTextProps = {
  text: string;
  ranges: ColorRange[];
  style?: StyleProp<ViewStyle>;
  selectable?: boolean;
  fontSize?: number;
  lineHeight?: number;
};

export const PerfText = ({
  style,
  fontSize,
  lineHeight,
  ranges,
  text,
}: PerfTextProps) => (
  <PerfTextNative
    style={style}
    text={text}
    colorRanges={ranges as NativeColorRange[]}
    fontFamily={'monospace'}
    fontSize={fontSize}
    lineHeight={lineHeight}
  />
);
