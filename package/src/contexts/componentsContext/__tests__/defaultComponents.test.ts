import { DEFAULT_COMPONENTS } from '../defaultComponents';

describe('DEFAULT_COMPONENTS', () => {
  it('should have all values defined', () => {
    const entries = Object.entries(DEFAULT_COMPONENTS);
    expect(entries.length).toBeGreaterThan(50);

    const unexpectedUndefined = entries.filter(([, value]) => value === undefined);
    if (unexpectedUndefined.length > 0) {
      console.log(
        'Unexpectedly undefined keys:',
        unexpectedUndefined.map(([k]) => k),
      );
    }
    expect(unexpectedUndefined).toEqual([]);
  });
});
