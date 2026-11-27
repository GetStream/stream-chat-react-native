import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Codegen spec for the native date and time picker, backed by Material dialogs on Android and a
 * `UIDatePicker` dialog on iOS.
 *
 * The spec exists in both `package/native-package/src/native` and `package/expo-package/src/native`,
 * since codegen reads each package separately. Keep the two copies identical.
 */

export type DateTimePickerOptions = {
  /** Either `date` or `time`. */
  mode: string;
  /** The moment the picker opens on, in milliseconds since the epoch. */
  value: number;
  minimumDate?: number;
  maximumDate?: number;
  /** Translated labels for the iOS dialog buttons. The Android dialogs provide their own. */
  confirmLabel: string;
  cancelLabel: string;
};

export interface Spec extends TurboModule {
  /** Resolves with the selected moment in milliseconds, or null when the picker is cancelled. */
  pick(options: DateTimePickerOptions): Promise<number | null>;
  /** Dismisses the picker currently shown, which resolves its `pick` call with null. */
  dismiss(): void;
}

export default TurboModuleRegistry.get<Spec>('StreamDateTimePicker');
