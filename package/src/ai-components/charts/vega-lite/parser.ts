import type { VegaLite } from './schema';
import type { ChartSpec, Datum } from '../types';
import { colorFromLabel } from '../utils';

export const parseVegalite = (spec: VegaLite): ChartSpec => {
  if (spec.type === 'pie') {
    const tField = spec.encoding?.theta?.field;
    const cField = spec.encoding?.color?.field;
    const usedHues: number[] = [];
    const data = (spec.data?.values ?? [])
      .map((d) => {
        const y = Number(d[tField]);
        const x = cField ? String(d[cField]) : '';
        return Number.isFinite(y)
          ? {
              dimension: x.trim(),
              value: y,
              color: colorFromLabel(x, usedHues),
            }
          : null;
      })
      .filter(Boolean) as Datum[];
    return { type: 'pie', data };
  }

  const { x, y, color } = spec.encoding;
  const xField = x?.field,
    yField = y?.field;
  const xIsTime = (x?.type ?? '').toLowerCase() === 'temporal';
  const xIsNumeric = (x?.type ?? '').toLowerCase() === 'quantitative';

  const data = (spec.data?.values ?? [])
    .map((d) => {
      const xv =
        xIsTime && typeof d[xField] === 'string'
          ? new Date(d[xField])
          : d[xField];
      const yv = Number(d[yField]);
      if (!Number.isFinite(yv)) return null;
      const c = color?.field ? String(d[color.field]) : undefined;
      return { dimension: xv, value: yv, color: c };
    })
    .filter(Boolean) as Datum[];

  return {
    type: spec.type === 'xy' && spec.markName !== 'arc' ? spec.markName : 'pie',
    data,
    isTemporalDim: xIsTime,
    isNumericDim: xIsNumeric,
  };
};
