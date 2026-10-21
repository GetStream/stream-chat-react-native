import { isRNVersionGreaterThanOrEqualTo } from './isRNVersionGreaterThanOrEqualTo';

/**
 * React Native capability flags, resolved once at module load. Named flags are easy to mock in
 * tests and to find and delete once the minimum supported React Native reaches their baseline.
 */

export const isRN86OrGreater = isRNVersionGreaterThanOrEqualTo('0.86.0');
