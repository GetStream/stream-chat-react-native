import type { ChartSpec } from '../types';
import { parseVegalite, VegaLiteSchema } from '../vega-lite';

export const parseJsonChart = (code: string): ChartSpec => {
  const json = JSON.parse(code);

  try {
    const parsedVegaLite = VegaLiteSchema.parse(json);
    return parseVegalite(parsedVegaLite);
  } catch (_error) {
    // Not a supported chart spec: fall through to the error below.
  }

  throw new Error('Unknown type of JSON formatted chart.');
};
