import { closeSheet } from '../../store/bottom-sheet-state-store.ts';

export const withCloseSheet = <T extends any[]>(
  callback: (
    ...args: T
  ) => void | Promise<void> | unknown | Promise<unknown> | undefined,
) => {
  return async (...args: T) => {
    const result = await callback(...args);
    closeSheet();
    return result;
  };
};
