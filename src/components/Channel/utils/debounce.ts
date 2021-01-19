import debounce from 'lodash/debounce';

export const heavyDebounce = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: (...params: any) => void,
  ms = 2000,
  option = {
    leading: true,
    trailing: true,
  },
) => debounce(callback, ms, option);
