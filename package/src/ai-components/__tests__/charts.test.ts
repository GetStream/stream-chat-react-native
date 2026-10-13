import { colorFromLabel, hashLabel, parseJsonChart, parseMermaid, xorshift32 } from '../charts';

describe('ai-components chart parsers', () => {
  describe('parseMermaid', () => {
    it('parses a pie chart with a title', () => {
      const spec = parseMermaid('pie\ntitle Pets\n"Dogs" : 386\n"Cats" : 85.5\nRats : 15');

      expect(spec.type).toBe('pie');
      expect(spec.title).toBe('Pets');
      expect(spec.data.map(({ dimension, value }) => ({ dimension, value }))).toEqual([
        { dimension: 'Dogs', value: 386 },
        { dimension: 'Cats', value: 85.5 },
        { dimension: 'Rats', value: 15 },
      ]);
      spec.data.forEach(({ color }) => expect(color).toMatch(/^#[0-9a-f]{6}$/i));
    });

    it('throws on unsupported diagrams', () => {
      expect(() => parseMermaid('graph TD\nA-->B')).toThrow('Unknown mermaid diagram type');
    });
  });

  describe('parseJsonChart', () => {
    it('parses a vega-lite bar chart', () => {
      const spec = parseJsonChart(
        JSON.stringify({
          data: {
            values: [
              { a: 'A', b: 28 },
              { a: 'B', b: 55 },
              { a: 'C', b: 'not a number' },
            ],
          },
          encoding: {
            x: { field: 'a', type: 'nominal' },
            y: { field: 'b', type: 'quantitative' },
          },
          mark: 'bar',
        }),
      );

      expect(spec.type).toBe('bar');
      expect(spec.data).toEqual([
        { color: undefined, dimension: 'A', value: 28 },
        { color: undefined, dimension: 'B', value: 55 },
      ]);
    });

    it('parses a vega-lite arc chart as a pie chart', () => {
      const spec = parseJsonChart(
        JSON.stringify({
          data: {
            values: [
              { category: 'x', value: 4 },
              { category: 'y', value: 6 },
            ],
          },
          encoding: {
            color: { field: 'category', type: 'nominal' },
            theta: { field: 'value', type: 'quantitative' },
          },
          mark: { type: 'arc' },
        }),
      );

      expect(spec.type).toBe('pie');
      expect(spec.data.map(({ dimension, value }) => ({ dimension, value }))).toEqual([
        { dimension: 'x', value: 4 },
        { dimension: 'y', value: 6 },
      ]);
    });

    it('takes the mark from the first layer', () => {
      const spec = parseJsonChart(
        JSON.stringify({
          data: { values: [{ t: '2024-01-01', v: 1 }] },
          encoding: { x: { field: 't', type: 'temporal' }, y: { field: 'v' } },
          layer: [{ mark: { type: 'line' } }],
        }),
      );

      expect(spec.type).toBe('line');
      expect(spec.isTemporalDim).toBe(true);
      expect(spec.data[0]?.dimension).toBeInstanceOf(Date);
    });

    it('rejects JSON that is not a supported chart', () => {
      expect(() => parseJsonChart(JSON.stringify({ hello: 'world' }))).toThrow(
        'Unknown type of JSON formatted chart.',
      );
      expect(() =>
        parseJsonChart(
          JSON.stringify({
            data: { values: [] },
            encoding: { x: { field: 'a' }, y: { field: 'b' } },
            mark: 'geoshape',
          }),
        ),
      ).toThrow();
      expect(() => parseJsonChart('{ not json')).toThrow();
    });
  });

  describe('colours', () => {
    it('hashes labels case and whitespace insensitively', () => {
      expect(hashLabel(' Dogs ')).toBe(hashLabel('dogs'));
      expect(hashLabel('dogs')).not.toBe(hashLabel('cats'));
    });

    it('produces a deterministic pseudo random sequence in [0, 1]', () => {
      const a = xorshift32(42);
      const b = xorshift32(42);
      for (let i = 0; i < 5; i++) {
        const value = a();
        expect(value).toBe(b());
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    it('gives stable, distinct colours per label', () => {
      const firstRun = ['a', 'b', 'c'].map((label) => colorFromLabel(label, []));
      const secondRun = ['a', 'b', 'c'].map((label) => colorFromLabel(label, []));
      expect(firstRun).toEqual(secondRun);

      const usedHues: number[] = [];
      const distinct = ['a', 'b', 'c', 'd'].map((label) => colorFromLabel(label, usedHues));
      expect(new Set(distinct).size).toBe(4);
    });
  });
});
