import React from 'react';
import type { ChartSpec } from './types';

import { VictoryChart } from './components';

export type ChartFromBlockProps = {
  spec: ChartSpec;
  height?: number;
  width?: number;
};

const Chart = ({ spec, height = 260, width = 225 }: ChartFromBlockProps) => {
  if (!spec) {
    return null;
  }

  return <VictoryChart spec={spec} width={width} height={height} />;
};

export default Chart;
