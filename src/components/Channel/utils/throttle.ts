import type { ThrottleSettings } from 'lodash';
import throttle from 'lodash/throttle';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const heavyThrottle = <T extends (...args: any) => any>(
  callback: T,
  ms = 500,
  option: ThrottleSettings = {
    leading: true,
    trailing: true,
  },
) => throttle(callback, ms, option);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const lightThrottle = <T extends (...args: any) => any>(
  callback: T,
  ms = 500,
  option: ThrottleSettings = {
    leading: true,
    trailing: true,
  },
) => throttle(callback, ms, option);
