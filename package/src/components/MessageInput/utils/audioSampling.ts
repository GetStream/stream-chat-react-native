export const resampleWaveformData = (waveformData: number[], amplitudesCount: number) =>
  waveformData.length === amplitudesCount
    ? waveformData
    : waveformData.length > amplitudesCount
      ? downSample(waveformData, amplitudesCount)
      : upSample(waveformData, amplitudesCount);

/**
 * The downSample function uses the Largest-Triangle-Three-Buckets (LTTB) algorithm.
 * See the thesis Downsampling Time Series for Visual Representation by Sveinn Steinarsson for more (https://skemman.is/bitstream/1946/15343/3/SS_MSthesis.pdf)
 * @param data
 * @param targetOutputSize
 */
export function downSample(data: number[], targetOutputSize: number): number[] {
  if (data.length <= targetOutputSize || targetOutputSize === 0) {
    return data;
  }

  if (targetOutputSize === 1) {
    return [mean(data)];
  }

  const result: number[] = [];
  // bucket size adjusted due to the fact that the first and the last item in the original data array is kept in target output
  const bucketSize = (data.length - 2) / (targetOutputSize - 2);
  let lastSelectedPointIndex = 0;
  result.push(data[lastSelectedPointIndex]); // Always add the first point
  let maxAreaPoint, maxArea, triangleArea;

  for (let bucketIndex = 1; bucketIndex < targetOutputSize - 1; bucketIndex++) {
    const previousBucketRefPoint = data[lastSelectedPointIndex];
    const nextBucketMean = getNextBucketMean(data, bucketIndex, bucketSize);

    const currentBucketStartIndex = Math.floor((bucketIndex - 1) * bucketSize) + 1;
    const nextBucketStartIndex = Math.floor(bucketIndex * bucketSize) + 1;
    const countUnitsBetweenAtoC = 1 + nextBucketStartIndex - currentBucketStartIndex;

    maxArea = triangleArea = -1;

    for (
      let currentPointIndex = currentBucketStartIndex;
      currentPointIndex < nextBucketStartIndex;
      currentPointIndex++
    ) {
      const countUnitsBetweenAtoB = Math.abs(currentPointIndex - currentBucketStartIndex) + 1;
      const countUnitsBetweenBtoC = countUnitsBetweenAtoC - countUnitsBetweenAtoB;
      const currentPointValue = data[currentPointIndex];

      triangleArea = triangleAreaHeron(
        triangleBase(Math.abs(previousBucketRefPoint - currentPointValue), countUnitsBetweenAtoB),
        triangleBase(Math.abs(currentPointValue - nextBucketMean), countUnitsBetweenBtoC),
        triangleBase(Math.abs(previousBucketRefPoint - nextBucketMean), countUnitsBetweenAtoC),
      );

      if (triangleArea > maxArea) {
        maxArea = triangleArea;
        maxAreaPoint = data[currentPointIndex];
        lastSelectedPointIndex = currentPointIndex;
      }
    }

    if (typeof maxAreaPoint !== 'undefined') {
      result.push(maxAreaPoint);
    }
  }

  result.push(data[data.length - 1]); // Always add the last point

  return result;
}

const triangleAreaHeron = (a: number, b: number, c: number) => {
  const s = (a + b + c) / 2;
  return Math.sqrt(s * (s - a) * (s - b) * (s - c));
};

const triangleBase = (a: number, b: number) => Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
const mean = (values: number[]) => values.reduce((acc, value) => acc + value, 0) / values.length;
export const divMod = (num: number, divisor: number) => [Math.floor(num / divisor), num % divisor];

const getNextBucketMean = (data: number[], currentBucketIndex: number, bucketSize: number) => {
  const nextBucketStartIndex = Math.floor(currentBucketIndex * bucketSize) + 1;
  let nextNextBucketStartIndex = Math.floor((currentBucketIndex + 1) * bucketSize) + 1;
  nextNextBucketStartIndex =
    nextNextBucketStartIndex < data.length ? nextNextBucketStartIndex : data.length;

  return mean(data.slice(nextBucketStartIndex, nextNextBucketStartIndex));
};

export const upSample = (values: number[], targetSize: number) => {
  if (!values.length) {
    console.warn('Cannot extend empty array of amplitudes.');
    return values;
  }

  if (values.length > targetSize) {
    console.warn('Requested to extend the waveformData that is longer than the target list size');
    return values;
  }

  if (targetSize === values.length) {
    return values;
  }

  // eslint-disable-next-line prefer-const
  let [bucketSize, remainder] = divMod(targetSize, values.length);
  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const extra = remainder && remainder-- ? 1 : 0;
    result.push(...Array(bucketSize + extra).fill(values[i]));
  }
  return result;
};
