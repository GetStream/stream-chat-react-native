import throttle from 'lodash/throttle';

export const heavyThrottle = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: (...params: any) => void,
  ms = 2000,
  option = {
    leading: true,
    trailing: true,
  },
) => throttle(callback, ms, option);

export const lightThrottle = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: (...params: any) => void,
  ms = 500,
  option = {
    leading: true,
    trailing: true,
  },
) => throttle(callback, ms, option);
