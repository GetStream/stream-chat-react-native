/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ThrottleSettings } from 'lodash';
import throttle from 'lodash/throttle';

export const heavyThrottle = <T extends (...args: any) => any>(
  callback: T,
  ms = 500,
  option: ThrottleSettings = {
    leading: true,
    trailing: true,
  },
) => throttle(callback, ms, option);

export const lightThrottle = <T extends (...args: any) => any>(
  callback: T,
  ms = 500,
  option: ThrottleSettings = {
    leading: true,
    trailing: true,
  },
) => throttle(callback, ms, option);
