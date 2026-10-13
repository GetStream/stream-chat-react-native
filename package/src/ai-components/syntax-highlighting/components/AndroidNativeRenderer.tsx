import { flattenRowsToTextAndColorRanges } from '../utils';
import { PerfText } from '../../components';
import React from 'react';

export const AndroidNativeRenderer = ({
  rows,
  stylesheet,
  defaultColor,
  fontFamily,
  fontSize,
  lineHeight = 17,
}: {
  rows: rendererNode[];
  stylesheet: rendererProps['stylesheet'];
  defaultColor: string;
  fontFamily?: string;
  fontSize: number;
  lineHeight: number;
}) => {
  const { text, ranges } = flattenRowsToTextAndColorRanges(rows, {
    stylesheet,
    defaultColor,
    fontFamily,
    fontSize,
  });

  return (
    <PerfText
      text={text}
      ranges={ranges}
      lineHeight={lineHeight}
      fontSize={fontSize}
    />
  );
};
