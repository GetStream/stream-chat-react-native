import {
  bounceScale,
  createBounce,
  easeOut,
  scaleAt,
  startBounce,
} from '../voice-visualization/bounce';
import {
  advanceDriver,
  createDriverState,
  driverReact,
  driverScale,
  ease,
  hoverDriver,
  LEVEL_RESPONSE,
  type LevelResponse,
  NO_TAP,
  tapDriver,
  type VoiceDriverInput,
  type VoiceDriverState,
} from '../voice-visualization/driver';
import type { Hsv, VoiceAgentState } from '../voice-visualization/types';

// Ported from stream-chat-android's VoiceVisualizationDriverTest and VoiceVisualizationBounceTest,
// so the platforms keep moving alike.

const blue: Hsv = { hue: 218 / 360, saturation: 1, value: 1 };
const red: Hsv = { hue: 0, saturation: 1, value: 1 };
const FRAME = 1 / 60;

const input = (
  state: VoiceAgentState,
  overrides: Partial<Omit<VoiceDriverInput, 'state'>> = {},
): VoiceDriverInput => ({
  audioLevel: null,
  colors: [blue],
  expressivity: 1,
  reduceMotion: false,
  state,
  ...overrides,
});

/** A driver with the input it reads each frame, as the view keeps them. */
const createDriver = (initial: VoiceDriverInput, response?: LevelResponse) => {
  const driver = { input: initial, state: createDriverState(initial, response) };
  return {
    ...driver,
    advance: (seconds: number) => advanceDriver(driver.state, driver.input, seconds),
    run: (seconds: number) => {
      for (let i = 0; i < Math.floor(seconds / FRAME); i++) {
        advanceDriver(driver.state, driver.input, FRAME);
      }
    },
    setInput: (next: VoiceDriverInput) => {
      driver.input = next;
    },
    get d(): VoiceDriverState {
      return driver.state;
    },
    get input() {
      return driver.input;
    },
  };
};

const expectNear = (actual: number, expected: number, tolerance: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);

describe('voice visualization driver', () => {
  it('starts settled on the state', () => {
    const { d } = createDriver(input('speaking'));

    expect(driverReact(d)).toBe(1);
    expect(d.load).toBe(0);
    expect(d.flow).toBe(0);
    expect(d.bright).toBe(1);
    expect(d.time).toBe(0);
    expect(d.count).toBe(1);
    expect(driverScale(d)).toBe(1);
    expect(d.tapAge).toBe(NO_TAP);
    expect(d.colors[0]).toEqual(blue);
    expect(d.colors[4]).toEqual(blue);
  });

  it('does not share its colors with the caller’s palette', () => {
    const palette = [{ ...blue }];
    const driver = createDriver(input('idle', { colors: palette }));
    driver.setInput(input('idle', { colors: [red] }));

    driver.run(1);

    expect(palette[0]).toEqual(blue);
  });

  it('eases toward the motion of a new state', () => {
    const driver = createDriver(input('idle'));
    driver.setInput(input('connecting'));

    driver.advance(FRAME);
    expectNear(driver.d.load, 0.08, 1e-4);
    driver.run(2);
    expectNear(driver.d.load, 1, 1e-3);
    expectNear(driverReact(driver.d), 0, 1e-3);
  });

  it('eases the same at any frame rate', () => {
    const at60 = createDriver(input('idle'));
    const at120 = createDriver(input('idle'));
    at60.setInput(input('speaking'));
    at120.setInput(input('speaking'));

    for (let i = 0; i < 30; i++) at60.advance(1 / 60);
    for (let i = 0; i < 60; i++) at120.advance(1 / 120);

    expectNear(driverReact(at60.d), driverReact(at120.d), 1e-4);
    expectNear(at60.d.time, at120.d.time, 1e-2);
  });

  it('clamps a long frame', () => {
    const driver = createDriver(input('idle'));

    driver.advance(5);

    expectNear(driver.d.time, 0.05 * 0.4, 1e-5);
  });

  it('turns the flow only while thinking', () => {
    const driver = createDriver(input('speaking'));
    driver.run(1);
    expect(driver.d.flowSpin).toBe(0);

    driver.setInput(input('thinking'));
    driver.run(1);
    expect(driver.d.flowSpin).toBeGreaterThan(0);
  });

  it('keeps the colors turning in every state', () => {
    const driver = createDriver(input('idle'));

    driver.run(1);

    expect(driver.d.orbSpin).toBeGreaterThan(0);
  });

  it('scales amplitude and speed with expressivity', () => {
    const lively = createDriver(input('speaking', { expressivity: 2 }));
    const still = createDriver(input('speaking', { expressivity: 0 }));

    expectNear(driverReact(lively.d), 1.85, 1e-5);
    expectNear(driverReact(still.d), 0.15, 1e-5);
    lively.advance(0.05);
    expectNear(lively.d.time, 0.05 * 1.25 * 1.4, 1e-5);
  });

  it('slows time and ignores the pointer under reduced motion', () => {
    const driver = createDriver(input('idle', { reduceMotion: true }));

    tapDriver(driver.d, driver.input, 0.1, 0.1);
    hoverDriver(driver.d, driver.input, 0.1, 0.1);
    driver.advance(0.05);

    expectNear(driver.d.time, 0.05 * 0.07 * 0.4, 1e-6);
    expect(driver.d.tapAge).toBeGreaterThan(NO_TAP);
    expect(driverScale(driver.d)).toBe(1);
    expect(driver.d.hoverAmount).toBe(0);
  });

  it('stops hovering once motion is reduced', () => {
    const driver = createDriver(input('idle'));
    hoverDriver(driver.d, driver.input, 0.1, 0.1);
    driver.run(1);

    driver.setInput(input('idle', { reduceMotion: true }));
    driver.run(1);

    expectNear(driver.d.hoverAmount, 0, 1e-3);
  });

  it('ripples from a tap and bounces', () => {
    const driver = createDriver(input('idle'));

    tapDriver(driver.d, driver.input, 0.1, -0.2);
    expect(driver.d.tapX).toBe(0.1);
    expect(driver.d.tapY).toBe(-0.2);
    expect(driver.d.tapAge).toBe(0);

    driver.advance(0.05);
    expectNear(driver.d.tapAge, 0.05, 1e-6);
    expect(driverScale(driver.d)).toBeLessThan(1);
    driver.run(0.5);
    expect(driverScale(driver.d)).toBe(1);
  });

  it('eases hovering in and out', () => {
    const driver = createDriver(input('idle'));

    hoverDriver(driver.d, driver.input, 0.2, 0.1);
    driver.run(1);
    expectNear(driver.d.hoverAmount, 1, 1e-3);
    expect(driver.d.hoverX).toBe(0.2);

    hoverDriver(driver.d, driver.input, null, null);
    driver.run(1);
    expectNear(driver.d.hoverAmount, 0, 1e-3);
    expect(driver.d.hoverX).toBe(0.2);
  });

  it('lifts the motion to a live audio level', () => {
    const driver = createDriver(input('idle', { audioLevel: 0.8 }));

    driver.run(2);
    expectNear(driver.d.mic, 0.8, 1e-3);
    expectNear(driver.d.voice, 1, 1e-3);
    expectNear(driverReact(driver.d), 0.8, 1e-3);

    driver.setInput(input('idle'));
    driver.run(2);
    expectNear(driver.d.voice, 0, 1e-3);
    expectNear(driverReact(driver.d), 0.12, 1e-3);
  });

  const settled = (response: LevelResponse, audioLevel: number) => {
    const driver = createDriver(input('idle', { audioLevel }), response);
    driver.run(1);
    return driver;
  };

  it('catches up with a louder level within a word when smooth', () => {
    const driver = settled(LEVEL_RESPONSE.smooth, 0);

    driver.setInput(input('idle', { audioLevel: 1 }));
    driver.run(0.1);
    expect(driver.d.mic).toBeGreaterThanOrEqual(0.5);
    expect(driver.d.mic).toBeLessThanOrEqual(0.8);
    driver.run(0.3);
    expect(driver.d.mic).toBeGreaterThan(0.95);
  });

  it('lets a quieter level fall away over a pause, not a syllable, when smooth', () => {
    const driver = settled(LEVEL_RESPONSE.smooth, 1);

    driver.setInput(input('idle', { audioLevel: 0 }));
    driver.run(0.1);
    expect(driver.d.mic).toBeGreaterThan(0.7);
    driver.run(0.9);
    expect(driver.d.mic).toBeLessThan(0.1);
  });

  it('follows a quieter level within a syllable when steady', () => {
    const driver = settled(LEVEL_RESPONSE.steady, 1);

    driver.setInput(input('idle', { audioLevel: 0 }));
    driver.run(0.1);
    expect(driver.d.mic).toBeLessThan(0.1);
  });

  it('eases a hue the short way round', () => {
    const driver = createDriver(
      input('idle', { colors: [{ hue: 0.95, saturation: 1, value: 1 }] }),
    );
    driver.setInput(input('idle', { colors: [{ hue: 0.05, saturation: 1, value: 1 }] }));

    driver.advance(FRAME);
    expectNear(driver.d.colors[0].hue, 0.962, 1e-4);
    driver.run(2);
    expectNear(driver.d.colors[0].hue, 0.05, 1e-3);
  });

  it('repeats the first color in empty slots and crossfades the count', () => {
    const driver = createDriver(input('idle', { colors: [blue, red] }));
    expect(driver.d.colors[1]).toEqual(red);
    expect(driver.d.colors[2]).toEqual(blue);

    driver.setInput(input('idle', { colors: [blue, red, red] }));
    driver.advance(FRAME);
    expectNear(driver.d.count, 2.12, 1e-4);
  });

  it('moves the per-frame share at 60 Hz', () => {
    expectNear(ease(0.08, 1 / 60), 0.08, 1e-5);
    expect(ease(0.08, 0)).toBe(0);
  });
});

describe('voice visualization bounce', () => {
  it('follows the keyframes', () => {
    expect(scaleAt(0)).toBe(1);
    expectNear(scaleAt(0.15), 0.965, 1e-5);
    expectNear(scaleAt(0.3), 0.93, 1e-5);
    expectNear(scaleAt(0.62), 1.03, 1e-5);
    expectNear(scaleAt(1), 1, 1e-5);
  });

  it('times them with the CSS ease-out', () => {
    expectNear(easeOut(0), 0, 1e-4);
    expectNear(easeOut(0.5), 0.684, 2e-3);
    expectNear(easeOut(1), 1, 1e-4);
  });

  it('dips, overshoots and settles', () => {
    const bounce = createBounce();
    expect(bounceScale(bounce)).toBe(1);

    startBounce(bounce);
    const scales = Array.from({ length: 21 }, () => {
      const scale = bounceScale(bounce);
      bounce.age += 1 / 60;
      return scale;
    });

    expectNear(scales[0], 1, 1e-9);
    expectNear(Math.min(...scales), 0.93, 0.01);
    expectNear(Math.max(...scales), 1.03, 0.01);
    expect(scales.indexOf(Math.min(...scales))).toBeLessThan(scales.indexOf(Math.max(...scales)));
    expect(bounceScale(bounce)).toBe(1);
  });
});
