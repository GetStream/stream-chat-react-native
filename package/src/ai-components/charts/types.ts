export type Dim = string;

export type Datum = {
  /** The categorical or temporal dimension: a label, category or time. */
  dimension: Dim;
  value: number;
  /** Color of this datum. In non-pie charts, datums sharing a color form one series. */
  color: string;
  /** Optional series key for multi-series charts. */
  series?: string;
};

export type ChartType = 'bar' | 'line' | 'area' | 'point' | 'pie';

export type ChartSpec = {
  type: ChartType;
  data: Datum[];
  seriesColors?: Record<string, string>;
  title?: string;
  orientation?: 'vertical' | 'horizontal';
  isTemporalDim?: boolean;
  isNumericDim?: boolean;
  dimDomain?: Dim[];
};
