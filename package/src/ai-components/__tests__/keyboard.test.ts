import { keyboardOverlapOf } from '../conversation/list/useKeyboardOverlap';

describe('keyboardOverlapOf', () => {
  it('is how far the keyboard rises past the offset, as far as it is open', () => {
    expect(keyboardOverlapOf({ height: 300, progress: 1 }, 34)).toBe(266);
    // Halfway through opening, the offset counts by half.
    expect(keyboardOverlapOf({ height: 150, progress: 0.5 }, 34)).toBe(133);
  });

  it('is nothing while the keyboard is down or below the offset', () => {
    expect(keyboardOverlapOf({ height: 0, progress: 0 }, 34)).toBe(0);
    expect(keyboardOverlapOf({ height: 20, progress: 1 }, 34)).toBe(0);
  });
});
