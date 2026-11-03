import { adb } from './AndroidSystemDialogs';

// Node built-ins, typed locally: the e2e project's types are limited to `detox/globals`.
declare const require: (module: 'fs' | 'os' | 'path') => {
  join: (...parts: string[]) => string;
  tmpdir: () => string;
  writeFileSync: (file: string, data: Uint8Array) => void;
};
declare const Buffer: { from: (data: string, encoding: 'base64') => Uint8Array };
const fs = require('fs');
const os = require('os');
const path = require('path');

/** A 1x1 PNG: enough for the gallery to list it and the composer to attach it. */
const PIXEL_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==';

/**
 * Puts `count` images into the Android media library, so the attachment picker's gallery shows
 * them. The test runner can't add to the iOS simulator's photo library from the host.
 */
export const seedImages = (count = 2) => {
  if (device.getPlatform() !== 'android') {
    throw new Error('seedImages is only supported on Android');
  }
  for (let i = 1; i <= count; i++) {
    const name = `e2e-image-${i}.png`;
    const local = path.join(os.tmpdir(), name);
    fs.writeFileSync(local, Buffer.from(PIXEL_PNG, 'base64'));
    const remote = `/sdcard/Pictures/${name}`;
    adb('push', local, remote);
    adb(
      'shell',
      'am',
      'broadcast',
      '-a',
      'android.intent.action.MEDIA_SCANNER_SCAN_FILE',
      '-d',
      `file://${remote}`,
    );
  }
};
