export const ONE_SECOND_IN_MS = 1000;

export const secondsUntil = (date: Date) =>
  Math.trunc((date.getTime() - Date.now()) / ONE_SECOND_IN_MS);
