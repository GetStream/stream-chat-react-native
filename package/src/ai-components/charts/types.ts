export type Dim = string;

export type Datum = {
  /** The categorical/temporal dimension (label, category, or time). */
  dimension: Dim;
  /** The numeric measure/value. */
  value: number;
  /** Color for this datum; the renderer will fall back to series color. */
  color: string;
  /** Optional series key for multi-series charts (e.g., region). */
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
