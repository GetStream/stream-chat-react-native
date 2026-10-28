/**
 * 3-D simplex noise, a port of the glow shader's `snoise` (Ashima Arts / Stefan Gustavson), so the
 * wave drawn on the CPU moves with the same speech rhythm as the shader, as on iOS and the web.
 *
 * It runs in float32 like a GPU, with `mod` as a multiply by a float32 reciprocal, because the
 * hash is sensitive to rounding: in exact arithmetic some inputs hash to a neighbouring gradient.
 * Every function is a worklet, as the motion runs on the UI thread.
 */

const INV_289 = Math.fround(1 / 289);
const ONE_THIRD = Math.fround(1 / 3);
const ONE_SIXTH = Math.fround(1 / 6);
const NS_X = Math.fround(2 / 7);
const NS_Y = Math.fround(Math.fround(0.5 * Math.fround(1 / 7)) - 1);
const NS_Z = Math.fround(1 / 7);

const mod289 = (x: number) => {
  'worklet';
  const f = Math.fround;
  return f(x - f(289 * Math.floor(f(x * INV_289))));
};

const permute = (x: number) => {
  'worklet';
  const f = Math.fround;
  return mod289(f(f(f(x * 34) + 1) * x));
};

const taylorInvSqrt = (r: number) => {
  'worklet';
  const f = Math.fround;
  return f(1.79284291400159 - f(0.85373472095314 * r));
};

/** A corner's contribution, its gradient from its hash as the shader's x_/y_/h/sh steps compute it. */
const corner = (p: number, x: number, y: number, z: number) => {
  'worklet';
  const f = Math.fround;
  const j = f(p - f(49 * Math.floor(f(f(p * NS_Z) * NS_Z))));
  const xi = Math.floor(f(j * NS_Z));
  const yi = Math.floor(f(j - f(7 * xi)));
  const gx0 = f(f(xi * NS_X) + NS_Y);
  const gy0 = f(f(yi * NS_X) + NS_Y);
  const gz = f(f(1 - Math.abs(gx0)) - Math.abs(gy0));
  const sh = gz <= 0 ? -1 : 0;
  const gx = f(gx0 + f((Math.floor(gx0) * 2 + 1) * sh));
  const gy = f(gy0 + f((Math.floor(gy0) * 2 + 1) * sh));
  const norm = taylorInvSqrt(gx * gx + gy * gy + gz * gz);
  const m = Math.max(0.6 - (x * x + y * y + z * z), 0);
  return m * m * m * m * (gx * norm * x + gy * norm * y + gz * norm * z);
};

/** Simplex noise at (x, y, z), from about -1 to 1. */
export const snoise = (inX: number, inY: number, inZ: number) => {
  'worklet';
  const f = Math.fround;
  const vx = f(inX);
  const vy = f(inY);
  const vz = f(inZ);
  const s = f(f(vx + vy + vz) * ONE_THIRD);
  const ix = Math.floor(f(vx + s));
  const iy = Math.floor(f(vy + s));
  const iz = Math.floor(f(vz + s));
  const t = f(f(ix + iy + iz) * ONE_SIXTH);
  const x0 = f(f(vx - ix) + t);
  const y0 = f(f(vy - iy) + t);
  const z0 = f(f(vz - iz) + t);

  const gx = x0 >= y0 ? 1 : 0;
  const gy = y0 >= z0 ? 1 : 0;
  const gz = z0 >= x0 ? 1 : 0;
  const i1x = Math.min(gx, 1 - gz);
  const i1y = Math.min(gy, 1 - gx);
  const i1z = Math.min(gz, 1 - gy);
  const i2x = Math.max(gx, 1 - gz);
  const i2y = Math.max(gy, 1 - gx);
  const i2z = Math.max(gz, 1 - gy);

  const mx = mod289(ix);
  const my = mod289(iy);
  const mz = mod289(iz);
  const hash = (dx: number, dy: number, dz: number) =>
    permute(f(f(permute(f(f(permute(f(mz + dz)) + my) + dy)) + mx) + dx));

  return (
    42 *
    (corner(hash(0, 0, 0), x0, y0, z0) +
      corner(hash(i1x, i1y, i1z), x0 - i1x + 1 / 6, y0 - i1y + 1 / 6, z0 - i1z + 1 / 6) +
      corner(hash(i2x, i2y, i2z), x0 - i2x + 1 / 3, y0 - i2y + 1 / 3, z0 - i2z + 1 / 3) +
      corner(hash(1, 1, 1), x0 - 0.5, y0 - 0.5, z0 - 0.5))
  );
};
