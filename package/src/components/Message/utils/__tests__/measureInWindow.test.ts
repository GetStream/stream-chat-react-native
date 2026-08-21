import { Dimensions, Platform } from 'react-native';

import type { EdgeInsets } from 'react-native-safe-area-context';

import type { ViewRef } from '../../../../types/react-native-compat';

import { isMeasuredRectBogus, measureInWindow } from '../measureInWindow';

// `measureInWindow` is globally mocked in jest-setup so other suites don't hit native
// measurement; this suite exercises the real implementation.
jest.unmock('../measureInWindow');

// measureInWindow reads `isRN86OrGreater` as a live binding at call time, so mocking the constants
// module with a mutable flag lets us exercise both the "RN handles the inset" and "we compensate"
// branches without reimporting. (Flag is `mock`-prefixed as jest requires for values referenced
// inside a mock factory.)
let mockIsRN86OrGreater = false;
jest.mock('../../../../utils/react-native-constants', () => ({
  __esModule: true,
  get isRN86OrGreater() {
    return mockIsRN86OrGreater;
  },
}));

// screen 400x800 => bogus threshold is |x| > 800 and |y| > 1600 (2x each)
const SCREEN = { fontScale: 1, height: 800, scale: 2, width: 400 };
const INSETS: EdgeInsets = { bottom: 10, left: 0, right: 0, top: 24 };

const setPlatform = (os: typeof Platform.OS) => {
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });
};

type MeasureInWindowTuple = [number, number, number, number];
type MeasureTuple = [number, number, number, number, number, number];

/**
 * Builds a fake native handle whose `measureInWindow`/`measure` callbacks fire synchronously
 * (as Fabric does). Omitting `measure` produces a handle without the method, exercising the
 * "no fallback available" branch.
 */
const makeNode = ({
  measure,
  measureInWindow: miw,
}: {
  measure?: MeasureTuple;
  measureInWindow: MeasureInWindowTuple;
}): { current: ViewRef | null } => {
  const handle: Record<string, unknown> = {
    measureInWindow: (cb: (...args: MeasureInWindowTuple) => void) => cb(...miw),
  };
  if (measure) {
    handle.measure = (cb: (...args: MeasureTuple) => void) => cb(...measure);
  }
  return { current: handle as unknown as ViewRef };
};

describe('isMeasuredRectBogus', () => {
  beforeEach(() => {
    jest.spyOn(Dimensions, 'get').mockReturnValue(SCREEN);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('accepts a normal on-screen rect', () => {
    expect(isMeasuredRectBogus(50, 300, 200, 40)).toBe(false);
  });

  it('accepts a rect within the 2x margin (e.g. partially off-screen)', () => {
    expect(isMeasuredRectBogus(50, 1500, 200, 40)).toBe(false);
  });

  it.each([
    ['NaN x', [NaN, 10, 20, 20]],
    ['NaN y', [10, NaN, 20, 20]],
    ['Infinity x', [Infinity, 10, 20, 20]],
    ['-Infinity y', [10, -Infinity, 20, 20]],
    ['NaN width', [10, 10, NaN, 20]],
    ['Infinity height', [10, 10, 20, Infinity]],
  ] as [string, MeasureInWindowTuple][])('flags non-finite values: %s', (_label, [x, y, w, h]) => {
    expect(isMeasuredRectBogus(x, y, w, h)).toBe(true);
  });

  it.each([
    ['zero width', [10, 10, 0, 40]],
    ['zero height', [10, 10, 40, 0]],
    ['negative width', [10, 10, -5, 40]],
    ['negative height', [10, 10, 40, -5]],
  ] as [string, MeasureInWindowTuple][])(
    'flags non-positive dimensions: %s',
    (_label, [x, y, w, h]) => {
      expect(isMeasuredRectBogus(x, y, w, h)).toBe(true);
    },
  );

  it.each([
    ['huge y (the FLAG_LAYOUT_NO_LIMITS failure)', [50, 29000, 40, 36]],
    ['huge x', [29000, 300, 40, 36]],
    ['huge negative x', [-2000, 300, 40, 36]],
    ['huge negative y', [50, -2000, 40, 36]],
  ] as [string, MeasureInWindowTuple][])(
    'flags coordinates beyond 2x the screen: %s',
    (_label, [x, y, w, h]) => {
      expect(isMeasuredRectBogus(x, y, w, h)).toBe(true);
    },
  );

  it('treats the exact 2x boundary as valid and just past it as bogus', () => {
    // bounds are 800 (x) and 1600 (y); the check uses strict `>`
    expect(isMeasuredRectBogus(800, 1600, 40, 36)).toBe(false);
    expect(isMeasuredRectBogus(801, 300, 40, 36)).toBe(true);
    expect(isMeasuredRectBogus(50, 1601, 40, 36)).toBe(true);
  });

  it('trusts the measurement when screen dimensions are unavailable', () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ ...SCREEN, height: 0, width: 0 });
    expect(isMeasuredRectBogus(99999, 99999, 40, 36)).toBe(false);
  });
});

describe('measureInWindow', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.spyOn(Dimensions, 'get').mockReturnValue(SCREEN);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    setPlatform(originalOS);
    mockIsRN86OrGreater = false;
  });

  it('rejects when the node is not mounted', async () => {
    await expect(measureInWindow({ current: null }, INSETS)).rejects.toThrow(/native handle/);
  });

  describe('healthy measurement (primary path)', () => {
    it('resolves with the window rect unchanged on iOS', async () => {
      setPlatform('ios');
      const node = makeNode({ measureInWindow: [10, 300, 200, 40] });
      await expect(measureInWindow(node, INSETS)).resolves.toEqual({
        h: 40,
        w: 200,
        x: 10,
        y: 300,
      });
    });

    it('compensates by insets.top on Android below RN 0.86', async () => {
      setPlatform('android');
      mockIsRN86OrGreater = false;
      const node = makeNode({ measureInWindow: [10, 300, 200, 40] });
      await expect(measureInWindow(node, INSETS)).resolves.toEqual({
        h: 40,
        w: 200,
        x: 10,
        y: 324,
      });
    });

    it('does not compensate on Android from RN 0.86 onward (RN corrects the inset natively)', async () => {
      setPlatform('android');
      mockIsRN86OrGreater = true;
      const node = makeNode({ measureInWindow: [10, 300, 200, 40] });
      await expect(measureInWindow(node, INSETS)).resolves.toEqual({
        h: 40,
        w: 200,
        x: 10,
        y: 300,
      });
    });
  });

  describe('bogus measurement (measure() fallback)', () => {
    it('falls back to root-relative pageX/pageY', async () => {
      setPlatform('ios');
      const node = makeNode({
        measure: [0, 0, 64, 36, 12, 717],
        measureInWindow: [28903, 29088, 64, 36],
      });
      await expect(measureInWindow(node, INSETS)).resolves.toEqual({ h: 36, w: 64, x: 12, y: 717 });
    });

    it('does not add insets.top to the fallback, since pageY already accounts for it', async () => {
      setPlatform('android');
      const node = makeNode({
        measure: [0, 0, 64, 36, 12, 717],
        measureInWindow: [28903, 29088, 64, 36],
      });
      await expect(measureInWindow(node, INSETS)).resolves.toEqual({ h: 36, w: 64, x: 12, y: 717 });
    });

    it('returns the compensated window rect when no measure() fallback is available (RN < 0.86)', async () => {
      setPlatform('android');
      mockIsRN86OrGreater = false;
      const node = makeNode({ measureInWindow: [28903, 29088, 64, 36] });
      await expect(measureInWindow(node, INSETS)).resolves.toEqual({
        h: 36,
        w: 64,
        x: 28903,
        y: 29112,
      });
    });

    it('returns the uncompensated window rect when no measure() fallback is available (RN >= 0.86)', async () => {
      setPlatform('android');
      mockIsRN86OrGreater = true;
      const node = makeNode({ measureInWindow: [28903, 29088, 64, 36] });
      await expect(measureInWindow(node, INSETS)).resolves.toEqual({
        h: 36,
        w: 64,
        x: 28903,
        y: 29088,
      });
    });
  });
});
