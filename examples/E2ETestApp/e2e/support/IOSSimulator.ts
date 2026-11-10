// Node built-ins, typed locally: the e2e project's types are limited to `detox/globals`.
declare const require: (module: 'child_process') => {
  execFileSync: (file: string, args: string[], options: { encoding: 'utf8' }) => string;
};

const { execFileSync } = require('child_process');

const bundleId = 'io.getstream.reactnative.e2etestapp';

/**
 * Grants the app photo library and camera access on the iOS simulator up front.
 *
 * Without it, the first test that opens the attachment picker (attachments, polls) raises the
 * system "Access Your Photo Library" prompt. A system alert outlives the app, so every later
 * `launchApp` sits behind it with the main queue busy until the hook times out: one prompt fails
 * every remaining test.
 *
 * - Not `launchApp({ permissions })`: Detox then runs `applesimutils --restartSB` on every launch,
 *   restarting SpringBoard (minutes per test on CI). This runs it once per suite, without the
 *   restart.
 * - Not `simctl privacy grant photos`: it writes an `auth_version` 1 row, which iOS 18+ ignores for
 *   Photos (it wants version 2), so the app still prompts. applesimutils writes version 2.
 * - tccd keeps answering from its cache (the reinstall left "not determined"), so it is stopped;
 *   launchd starts a fresh one that reads the grants.
 */
export const grantIOSPermissions = () => {
  if (device.getPlatform() !== 'ios') {
    return;
  }
  const run = (file: string, args: string[]) => execFileSync(file, args, { encoding: 'utf8' });
  run('applesimutils', [
    '--byId',
    device.id,
    '--bundle',
    bundleId,
    '--setPermissions',
    'photos=YES, camera=YES',
  ]);
  run('xcrun', ['simctl', 'spawn', device.id, 'launchctl', 'stop', 'com.apple.tccd']);
};

/**
 * The major iOS version of the simulator under test, from its runtime
 * (`com.apple.CoreSimulator.SimRuntime.iOS-17-5`); `undefined` off iOS or when it can't be found.
 */
export const iosMajorVersion = (): number | undefined => {
  if (device.getPlatform() !== 'ios') {
    return undefined;
  }
  try {
    const { devices } = JSON.parse(
      execFileSync('xcrun', ['simctl', 'list', 'devices', '-j'], { encoding: 'utf8' }),
    ) as { devices: Record<string, { udid: string }[]> };
    const runtime = Object.keys(devices).find((key) =>
      devices[key].some((simulator) => simulator.udid === device.id),
    );
    const major = runtime?.match(/iOS-(\d+)-/)?.[1];
    return major === undefined ? undefined : Number(major);
  } catch {
    return undefined;
  }
};
