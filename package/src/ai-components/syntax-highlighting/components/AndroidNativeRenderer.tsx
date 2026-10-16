import React from 'react';

import { PerfText } from '../../components';
import { flattenRowsToTextAndColorRanges } from '../utils';

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

  return <PerfText text={text} ranges={ranges} lineHeight={lineHeight} fontSize={fontSize} />;
};
