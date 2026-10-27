import { audioLevelInput, expressivityInput, speechEnv } from '../voice-visualization/math';
import { luminance, parseColor, rgbToHsv, toHsvPalette } from '../voice-visualization/palette';
import { snoise } from '../voice-visualization/simplex';
import { GLOW_STYLE, WAVE_STYLE } from '../voice-visualization/styles';

describe('voice visualization palette', () => {
  it('keeps a color’s full hue, saturation and value', () => {
    const hsv = rgbToHsv([0, 95 / 255, 1]);

    expect(hsv.hue * 360).toBeCloseTo(217.6, 1);
    expect(hsv.saturation).toBeCloseTo(1, 4);
    expect(hsv.value).toBeCloseTo(1, 4);
  });

  it('keeps a muted color muted', () => {
    // hsv(108°, 25%, 60%)
    const hsv = rgbToHsv([0.48, 0.6, 0.45]);

    expect(hsv.hue).toBeCloseTo(0.3, 2);
    expect(hsv.saturation).toBeCloseTo(0.25, 2);
    expect(hsv.value).toBeCloseTo(0.6, 4);
  });

  it('gives a gray no saturation', () => {
    const hsv = rgbToHsv([0.5, 0.5, 0.5]);

    expect(hsv.saturation).toBe(0);
    expect(hsv.value).toBe(0.5);
  });

  it.each([
    ['#005fff', [0, 95 / 255, 1]],
    ['#0af', [0, 170 / 255, 1]],
    ['#005fff80', [0, 95 / 255, 1]],
    ['rgb(0, 95, 255)', [0, 95 / 255, 1]],
    ['rgba(0, 95, 255, 0.5)', [0, 95 / 255, 1]],
    ['hsl(0, 100%, 50%)', [1, 0, 0]],
    ['rebeccapurple', [0.4, 0.2, 0.6]],
    ['#000000', [0, 0, 0]],
  ])('reads %s', (color, expected) => {
    const rgb = parseColor(color);
    expect(rgb).not.toBeNull();
    rgb?.forEach((channel, i) => expect(channel).toBeCloseTo(expected[i], 2));
  });

  it('skips colors it cannot read', () => {
    expect(parseColor('not-a-color')).toBeNull();
    expect(parseColor('#12345')).toBeNull();
    expect(parseColor('')).toBeNull();
    expect(toHsvPalette(['nope', '#ff0000'])).toHaveLength(1);
  });

  it('keeps only the first five colors', () => {
    expect(toHsvPalette(Array.from({ length: 7 }, () => '#ff0000'))).toHaveLength(5);
  });

  it('measures luminance for the light or dark look', () => {
    expect(luminance('#ffffff')).toBeCloseTo(1, 4);
    expect(luminance('#000000')).toBe(0);
    expect(luminance('#1c1e22')).toBeLessThan(0.5);
    expect(luminance('')).toBeNull();
  });
});

describe('voice visualization inputs', () => {
  it('clamps expressivity to 0-2 and replaces one that is not a number', () => {
    expect(expressivityInput(3)).toBe(2);
    expect(expressivityInput(-1)).toBe(0);
    expect(expressivityInput(0.5)).toBe(0.5);
    expect(expressivityInput(Number.NaN)).toBe(1);
    expect(expressivityInput(Number.POSITIVE_INFINITY)).toBe(1);
    expect(expressivityInput(undefined)).toBe(1);
  });

  it('clamps the audio level to 0-1 and treats one that is not a number as no audio', () => {
    expect(audioLevelInput(2)).toBe(1);
    expect(audioLevelInput(-1)).toBe(0);
    expect(audioLevelInput(0.4)).toBe(0.4);
    expect(audioLevelInput(Number.NaN)).toBeNull();
    expect(audioLevelInput(null)).toBeNull();
    expect(audioLevelInput(undefined)).toBeNull();
  });
});

describe('voice visualization noise', () => {
  it('matches the shader’s simplex noise as a GPU computes it', () => {
    // Read back from the shader's own snoise on a GPU (stream-chat-react's fixtures).
    const gpu: Array<[number, number, number, number]> = [
      [0.3, 21, 0, 0.7696],
      [1.7, 5, 0, 0.208],
      [0.12, 0, 0, 0.049],
      [2.5, 9, 0, 0.3869],
      [10.2, 14, 0, 0.603],
      [3.3, 1.1, 0.9, -0.7541],
      [0.05, 0.05, 0.05, -0.5481],
    ];
    for (const [x, y, z, expected] of gpu) {
      expect(snoise(x, y, z)).toBeCloseTo(expected, 2);
    }
  });

  it('gives speech phrases and pauses', () => {
    const samples = Array.from({ length: 2000 }, (_, i) => speechEnv(i * 0.01));

    expect(Math.min(...samples)).toBe(0);
    expect(Math.max(...samples)).toBeGreaterThan(0.6);
    expect(Math.max(...samples)).toBeLessThanOrEqual(1);
  });
});

describe('voice visualization hit areas', () => {
  it('takes the globe within a third of the shorter side', () => {
    expect(GLOW_STYLE.contains(0, 0)).toBe(true);
    expect(GLOW_STYLE.contains(0.2, 0.2)).toBe(true);
    expect(GLOW_STYLE.contains(0.3, 0.3)).toBe(false);
  });

  it('takes the string across, and only near its line', () => {
    expect(WAVE_STYLE.contains(0.45, 0)).toBe(true);
    expect(WAVE_STYLE.contains(0, 0.1)).toBe(true);
    expect(WAVE_STYLE.contains(0, 0.2)).toBe(false);
    expect(WAVE_STYLE.contains(0.55, 0)).toBe(false);
  });
});
