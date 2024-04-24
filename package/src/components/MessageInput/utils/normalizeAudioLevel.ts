/**
 * Utility function to normalize the audio level.
 */
export const normalizeAudioLevel = (value: number, higherLowerBound?: boolean) => {
  console.log(higherLowerBound);
  // For Native CLI, the lower bound is around -50
  const lowerBound = higherLowerBound === true ? -120 : -50;
  const upperBound = 0;

  const delta = upperBound - lowerBound;

  // In Native CLI Android, the value is undefined for loud audio
  if (value === undefined) return 1;

  if (value < lowerBound) {
    return 0;
  } else if (value >= upperBound) {
    return 1;
  } else {
    return Math.abs((value - lowerBound) / delta);
  }
};
