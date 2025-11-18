// hashing and rng
export const hashLabel = (raw: string) => {
  const s = raw.trim().toLowerCase().normalize('NFKC');
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
};

export const xorshift32 = (seed: number) => {
  let x = seed || 123456789;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
};

// color utils
export const hslToHex = (h: number, s = 68, l = 52) => {
  const S = s / 100,
    L = l / 100;
  const C = (1 - Math.abs(2 * L - 1)) * S;
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = L - C / 2;
  const [r1, g1, b1] =
    h < 60
      ? [C, X, 0]
      : h < 120
        ? [X, C, 0]
        : h < 180
          ? [0, C, X]
          : h < 240
            ? [0, X, C]
            : h < 300
              ? [X, 0, C]
              : [C, 0, X];
  const r = Math.round((r1 + m) * 255)
    .toString(16)
    .padStart(2, '0');
  const g = Math.round((g1 + m) * 255)
    .toString(16)
    .padStart(2, '0');
  const b = Math.round((b1 + m) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${r}${g}${b}`;
};

// ensure hues not closer than MIN_SEP degrees within the same chart
export const colorFromLabel = (
  label: string,
  usedHues: number[],
  opts?: { minSep?: number; sat?: number; light?: number },
) => {
  const { minSep = 25, sat = 68, light = 52 } = opts || {};
  const seed = hashLabel(label);
  const rand = xorshift32(seed);

  // base hue from RNG (looks random, but stable)
  let hue = Math.floor(rand() * 360);

  // nudge away from already used hues in THIS chart
  let attempts = 0;
  const tooClose = (h: number) =>
    usedHues.some((u) => {
      const d = Math.abs(h - u);
      return Math.min(d, 360 - d) < minSep;
    });

  while (tooClose(hue) && attempts < 48) {
    hue = (hue + 137.508) % 360; // golden-angle hop
    attempts++;
  }

  usedHues.push(hue);
  return hslToHex(hue, sat, light);
};
