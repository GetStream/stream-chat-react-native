/**
 * Utility function to normalize the audio level.
 */
export const normalizeAudioLevel = (value: number, higherLowerBound?: boolean) => {
  const lowerBound = higherLowerBound ? -160 : -60;
  const upperBound = 0;

  const delta = upperBound - lowerBound;

  if (!value) return 0;

  if (value < lowerBound) {
    return 0;
  } else if (value > upperBound) {
    return 1;
  } else {
    return Math.abs((value - lowerBound) / delta);
  }
};
