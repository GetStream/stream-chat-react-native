import type { ChartSpec } from '../types';
import { parseVegalite, VegaLiteSchema } from '../vega-lite';

export const parseJsonChart = (code: string): ChartSpec => {
  try {
    const parsedVegaLite = VegaLiteSchema.parse(JSON.parse(code));
    return parseVegalite(parsedVegaLite);
  } catch (_error) {
    // Invalid JSON or not a supported chart spec: fall through to the error below.
  }

  throw new Error('Unknown type of JSON formatted chart.');
};
