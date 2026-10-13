import React from 'react';

import { VictoryChart } from './components';
import type { ChartSpec } from './types';

export type ChartFromBlockProps = {
  spec: ChartSpec;
  height?: number;
  width?: number;
};

const Chart = ({ spec, height = 260, width }: ChartFromBlockProps) => {
  if (!spec) {
    return null;
  }

  return <VictoryChart spec={spec} width={width} height={height} />;
};

export default Chart;
