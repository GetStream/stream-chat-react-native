/**
 * Maps an audio level between `lowerBound` and 0 to the range 0 to 1.
 *
 * @param value The audio level. An undefined value counts as the loudest level.
 * @param lowerBound The level that maps to 0. Quieter levels also map to 0.
 * @returns The normalized level.
 */
export const normalizeAudioLevel = (value: number, lowerBound: number) => {
  // For Native CLI, the lower bound is around -50
  const upperBound = 0;

  const delta = upperBound - lowerBound;

  // In Native CLI Android, the value is undefined for loud audio
  if (value === undefined) {
    return 1;
  }

  if (value < lowerBound) {
    return 0;
  } else if (value >= upperBound) {
    return 1;
  } else {
    return Math.abs((value - lowerBound) / delta);
  }
};
