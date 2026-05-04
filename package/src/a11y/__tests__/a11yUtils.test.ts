import {
  composeAccessibilityLabel,
  formatAccessibilityValue,
  mergeAccessibilityActions,
} from '../a11yUtils';

describe('composeAccessibilityLabel', () => {
  it('joins non-empty parts with comma+space', () => {
    expect(composeAccessibilityLabel('Alice', '12:34', 'Hello')).toBe('Alice, 12:34, Hello');
  });

  it('drops empty strings, null, undefined, false', () => {
    expect(composeAccessibilityLabel('A', '', null, undefined, false, 'B')).toBe('A, B');
  });

  it('returns empty string when nothing to join', () => {
    expect(composeAccessibilityLabel(null, undefined, '')).toBe('');
  });
});

describe('formatAccessibilityValue', () => {
  it('clamps now between min and max', () => {
    expect(formatAccessibilityValue({ max: 100, now: 200 })).toEqual({ max: 100, min: 0, now: 100 });
    expect(formatAccessibilityValue({ max: 100, min: 10, now: 5 })).toEqual({
      max: 100,
      min: 10,
      now: 10,
    });
  });

  it('attaches optional text', () => {
    expect(formatAccessibilityValue({ max: 60, now: 30, text: '00:30 of 01:00' })).toEqual({
      max: 60,
      min: 0,
      now: 30,
      text: '00:30 of 01:00',
    });
  });

  it('omits text when not provided', () => {
    const result = formatAccessibilityValue({ max: 60, now: 30 });
    expect(result).not.toHaveProperty('text');
  });
});

describe('mergeAccessibilityActions', () => {
  it('merges and deduplicates by name (later wins)', () => {
    const merged = mergeAccessibilityActions(
      [{ name: 'activate', label: 'old' }, { name: 'react' }],
      [{ name: 'activate', label: 'new' }, { name: 'reply' }],
    );
    expect(merged).toEqual([
      { name: 'activate', label: 'new' },
      { name: 'react' },
      { name: 'reply' },
    ]);
  });

  it('skips undefined inputs', () => {
    expect(mergeAccessibilityActions(undefined, [{ name: 'a' }])).toEqual([{ name: 'a' }]);
  });

  it('returns empty array when no inputs', () => {
    expect(mergeAccessibilityActions()).toEqual([]);
  });
});
