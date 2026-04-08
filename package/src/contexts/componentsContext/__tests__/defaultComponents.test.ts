import { DEFAULT_COMPONENTS } from '../defaultComponents';

describe('DEFAULT_COMPONENTS', () => {
  it('should have all values defined (no undefined)', () => {
    const entries = Object.entries(DEFAULT_COMPONENTS);
    expect(entries.length).toBeGreaterThan(50);

    const undefinedEntries = entries.filter(([, v]) => v === undefined);
    if (undefinedEntries.length > 0) {
      console.log(
        'Undefined keys:',
        undefinedEntries.map(([k]) => k),
      );
    }
    expect(undefinedEntries).toEqual([]);
  });
});
