import type { DebounceSettings } from 'lodash';
import debounce from 'lodash/debounce';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const heavyDebounce = <T extends (...args: any) => any>(
  callback: T,
  ms = 500,
  option: DebounceSettings = {
    leading: true,
    trailing: true,
  },
) => debounce(callback, ms, option);
