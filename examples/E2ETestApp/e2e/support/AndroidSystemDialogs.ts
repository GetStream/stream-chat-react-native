// Node built-ins, typed locally: the e2e project's types are limited to `detox/globals`.
declare const process: { env: Record<string, string | undefined> };
declare const require: (module: 'child_process') => {
  execFileSync: (file: string, args: string[], options: { encoding: 'utf8' }) => string;
};

const { execFileSync } = require('child_process');

const sdkRoot = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
const adbPath = sdkRoot ? `${sdkRoot}/platform-tools/adb` : 'adb';

const adb = (...args: string[]) => {
  const serial = process.env.DETOX_ADB_NAME;
  const deviceArgs = serial && !serial.includes('*') ? ['-s', serial] : [];
  return execFileSync(adbPath, [...deviceArgs, ...args], { encoding: 'utf8' });
};

/**
 * Dismisses an "<app> isn't responding" dialog, if one is showing. On a slow CI emulator the
 * launcher (Quickstep) can hit an ANR; its dialog takes window focus, and Espresso then fails every
 * test waiting for the app's window to get it. Same handling as the `wait_android_emu_idle` fastlane
 * action: Enter picks "Close app", except for System UI, where it picks "Wait".
 */
export const dismissAnrDialog = () => {
  try {
    const focus = adb('shell', 'dumpsys', 'window')
      .split('\n')
      .find(
        (line) => line.includes('mCurrentFocus') && line.includes('Application Not Responding'),
      );
    if (!focus) {
      return;
    }
    console.warn(`Dismissing an ANR dialog: ${focus.trim()}`);
    if (focus.includes('com.android.systemui')) {
      adb('shell', 'input', 'keyevent', 'KEYCODE_DPAD_DOWN');
    }
    adb('shell', 'input', 'keyevent', 'KEYCODE_ENTER');
  } catch (error) {
    // Best effort: a failed check must not fail the test on its own.
    console.warn(`Could not check for ANR dialogs: ${String(error)}`);
  }
};
