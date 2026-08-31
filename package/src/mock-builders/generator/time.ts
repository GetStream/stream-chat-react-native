import { dateToNs, msToNs, nowNs } from 'stream-chat';

/**
 * Normalizes whatever a test hands a generator into the unix-**nanosecond** number the API puts on
 * the wire.
 *
 * Fixtures have to model the wire — a generator that emits `Date` objects or ISO strings cannot
 * catch the bugs that unit exists to prevent — but a test reads far better written against a date
 * literal. So the generators accept `Date`, an ISO string, or a raw wire number and convert here.
 *
 * A bare `number` is taken to be nanoseconds already, matching the SDK's unit everywhere else.
 */
export const convertDateToTimestamp = (value?: Date | number | string): number => {
  if (value === undefined) return nowNs();
  if (value instanceof Date) return dateToNs(value);
  if (typeof value === 'number') return value;
  return msToNs(Date.parse(value));
};
