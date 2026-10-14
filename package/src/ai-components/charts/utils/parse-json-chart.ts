import type { ChartSpec } from '../types';
import { parseVegalite, VegaLiteSchema } from '../vega-lite';

export const parseJsonChart = (code: string): ChartSpec => {
  const json = JSON.parse(code);

  try {
    const parsedVegaLite = VegaLiteSchema.parse(json);
    return parseVegalite(parsedVegaLite);
  } catch (_error) {
    /* do nothing */
  }

  throw new Error('Unknown type of JSON formatted chart.');
};
