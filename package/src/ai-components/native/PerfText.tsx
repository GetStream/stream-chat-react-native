import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { NativeHandlers } from '../../native';
import type { ColorRange } from '../syntax-highlighting';

export type PerfTextProps = {
  text: string;
  ranges: ColorRange[];
  style?: StyleProp<ViewStyle>;
  selectable?: boolean;
  fontSize?: number;
  lineHeight?: number;
};

export const PerfText = ({ style, fontSize, lineHeight, ranges, text }: PerfTextProps) => {
  const PerfTextNative = NativeHandlers.PerfText;
  if (!PerfTextNative) {
    return null;
  }

  return (
    <PerfTextNative
      style={style}
      text={text}
      colorRanges={ranges as { color: number; end: number; start: number }[]}
      fontFamily={'monospace'}
      fontSize={fontSize}
      lineHeight={lineHeight}
    />
  );
};
