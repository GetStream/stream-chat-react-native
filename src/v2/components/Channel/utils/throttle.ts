import throttle from 'lodash/throttle';

export const heavyThrottle = (
  callback: () => void,
  ms = 2000,
  option = {
    leading: true,
    trailing: true,
  },
) => throttle(callback, ms, option);

export const lightThrottle = (
  callback: () => void,
  ms = 500,
  option = {
    leading: true,
    trailing: true,
  },
) => throttle(callback, ms, option);
