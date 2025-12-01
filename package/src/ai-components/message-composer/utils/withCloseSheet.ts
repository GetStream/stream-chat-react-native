import { sheetStoreApi } from '../../store';

export const withCloseSheet = <T extends any[]>(
  callback: (
    ...args: T
  ) => void | Promise<void> | unknown | Promise<unknown> | undefined,
) => {
  return async (...args: T) => {
    const result = await callback(...args);
    sheetStoreApi.closeSheet();
    return result;
  };
};
