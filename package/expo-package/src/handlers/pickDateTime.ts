import type { PickDateTime } from 'stream-chat-react-native-core';

import NativeStreamDateTimePicker from '../native/NativeStreamDateTimePicker';

/**
 * Opens the system date or time picker. Resolves with the selected moment, or with `null` when the
 * picker is cancelled, aborted through `signal`, or unavailable because the native module is absent.
 */
export const pickDateTime: PickDateTime = async ({
  cancelLabel,
  confirmLabel,
  maximumDate,
  minimumDate,
  mode,
  signal,
  value,
}) => {
  const nativePicker = NativeStreamDateTimePicker;
  if (!nativePicker || signal?.aborted) return null;

  // Only one picker is shown at a time, so dismissing the current picker closes this one.
  const dismiss = () => nativePicker.dismiss();
  signal?.addEventListener('abort', dismiss);
  try {
    const picked = await nativePicker.pick({
      cancelLabel,
      confirmLabel,
      maximumDate: maximumDate?.getTime(),
      minimumDate: minimumDate?.getTime(),
      mode,
      value: value.getTime(),
    });
    return picked === null || signal?.aborted ? null : new Date(picked);
  } finally {
    signal?.removeEventListener('abort', dismiss);
  }
};
