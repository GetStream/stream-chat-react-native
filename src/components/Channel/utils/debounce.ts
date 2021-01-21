/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DebounceSettings } from 'lodash';
import debounce from 'lodash/debounce';

export const heavyDebounce = <T extends (...args: any) => any>(
  callback: T,
  ms = 500,
  option: DebounceSettings = {
    leading: true,
    trailing: true,
  },
) => debounce(callback, ms, option);
