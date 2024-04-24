/**
 * Utility function to normalize the audio level.
 */
export const normalizeAudioLevel = (value: number, higherLowerBound?: boolean) => {
  // For Native CLI, the lower bound is around -50
  const lowerBound = higherLowerBound ? -120 : -50;
  const upperBound = 0;

  const delta = upperBound - lowerBound;

  // In Native CLI Android, the value is undefined for loud audio
  if (value === undefined) return upperBound;

  if (value < lowerBound) {
    return 0;
  } else if (value >= upperBound) {
    return 1;
  } else {
    return Math.abs((value - lowerBound) / delta);
  }
};
