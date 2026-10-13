import { z } from 'zod';

/* primitives */
export const VLType = z.enum([
  'quantitative',
  'ordinal',
  'nominal',
  'temporal',
]);

const FieldRef = z.object({
  field: z.string(),
  type: VLType.optional(),
});

const ColorXY = z.object({
  field: z.string().optional(),
  type: VLType.optional(),
});
const ColorPie = z.object({ field: z.string(), type: VLType.optional() });

/* we support only these currently */
const MarkName = z.enum([
  'bar',
  'line',
  'area',
  'point',
  'arc',
  // 'rect',
  // 'rule',
  // 'text',
  // 'tick',
  // 'circle',
  // 'square',
  // 'trail',
  // 'geoshape',
  // 'image',
]);

const MarkDef = z.looseObject({
  type: z.union([MarkName, z.string()]).optional(),
});

/* encodings */
const XyEncoding = z.object({
  x: FieldRef,
  y: FieldRef,
  color: ColorXY.optional(),
});

const PieEncoding = z.object({
  theta: FieldRef,
  color: ColorPie.optional(),
});

/* base spec */
const BaseVL = z.object({
  archetype: z.literal('vegalite'),
  $schema: z.string().optional(),
  data: z.object({
    values: z.array(z.record(z.string(), z.unknown())),
  }),
  mark: z.union([MarkName, MarkDef, z.string()]).optional(),
  layer: z.array(z.looseObject({ mark: MarkDef })).optional(),
  marks: z.array(MarkDef).optional(),
  markName: MarkName,
});

/* branches (with explicit kind) */
const VL_XY = BaseVL.extend({
  type: z.literal('xy'),
  encoding: XyEncoding,
}).strip();

const VL_PIE = BaseVL.extend({
  type: z.literal('pie'),
  encoding: PieEncoding,
}).strip();

const normalizeMarkName = (m: unknown): string | undefined => {
  if (typeof m === 'string') return m.toLowerCase();
  if (m && typeof m === 'object' && typeof (m as any).type === 'string') {
    return String((m as any).type).toLowerCase();
  }
  return undefined;
};

const deriveMarkName = (o: any): string | undefined => {
  // spec.mark (string or MarkDef)
  const direct = normalizeMarkName(o?.mark);
  if (direct) return direct;

  // first layer's mark.type
  const firstLayerMark =
    Array.isArray(o?.layer) && o.layer[0]?.mark
      ? normalizeMarkName(o.layer[0].mark)
      : undefined;
  if (firstLayerMark) return firstLayerMark;

  // first marks[] item .type
  return Array.isArray(o?.marks) && o.marks.length > 0
    ? normalizeMarkName(o.marks[0])
    : undefined;
};

export const VegaLiteCore = z.discriminatedUnion('type', [VL_XY, VL_PIE]);

/* final schema: preprocess to inject needed metadata, then discriminated union */
export const VegaLiteSchema = z.preprocess((raw) => {
  const o: any = raw ?? {};
  const markName = deriveMarkName(o);
  const hasTheta = !!o?.encoding?.theta;

  const type = markName === 'arc' || hasTheta ? 'pie' : 'xy';

  return { ...o, type, archetype: 'vegalite', markName };
}, VegaLiteCore);

export type VegaLite = z.infer<typeof VegaLiteSchema>;
