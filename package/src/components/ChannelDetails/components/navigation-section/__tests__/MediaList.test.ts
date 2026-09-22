import { getNumberOfColumns } from '../mediaListColumns';

describe('getNumberOfColumns', () => {
  // Phone widths must be unchanged by the resizable-window work.
  it.each([320, 375, 390, 414, 440, 466, 599])('stays at 3 columns at %ipt', (width) => {
    expect(getNumberOfColumns(width)).toBe(3);
  });

  // Measured on iPhone Duo: inner display is 669pt portrait / 951pt landscape.
  it('adds columns once the container is wide enough', () => {
    expect(getNumberOfColumns(600)).toBe(4);
    expect(getNumberOfColumns(669)).toBe(4);
    expect(getNumberOfColumns(951)).toBe(6);
  });

  // Apple's guidance: an odd count puts a column of tiles directly across the fold.
  it('only ever uses an even column count past the breakpoint', () => {
    for (let width = 600; width <= 1600; width += 1) {
      expect(getNumberOfColumns(width) % 2).toBe(0);
    }
  });

  it('never drops below the phone column count, whatever the width', () => {
    expect(getNumberOfColumns(0)).toBe(3);
    expect(getNumberOfColumns(1)).toBe(3);
    expect(getNumberOfColumns(4000)).toBeGreaterThanOrEqual(3);
  });

  it('keeps tiles within a sane size band across the whole continuum', () => {
    for (const width of [320, 390, 466, 600, 669, 800, 951, 1200]) {
      const tileSize = width / getNumberOfColumns(width);
      expect(tileSize).toBeLessThan(205);
    }
  });
});
