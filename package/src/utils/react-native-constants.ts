import { isRNVersionGreaterThanOrEqualTo } from './isRNVersionGreaterThanOrEqualTo';

/**
 * React Native capability flags, resolved once at module load - the RN version is fixed for the
 * lifetime of the app. Keeping version gates as named flags here makes them easy to mock in tests
 * and easy to retire later: when the SDK's minimum supported React Native reaches a baseline, grep
 * for the flag to find every gated code path and delete both the flag and the branches it guarded.
 */

export const isRN86OrGreater = isRNVersionGreaterThanOrEqualTo('0.86.0');
