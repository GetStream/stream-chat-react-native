/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 300000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/detox/Build/Products/Debug-iphonesimulator/E2ETestApp.app',
      build:
        'xcodebuild -workspace ios/E2ETestApp.xcworkspace -scheme E2ETestApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build/detox',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/detox/Build/Products/Release-iphonesimulator/E2ETestApp.app',
      build:
        'xcodebuild -workspace ios/E2ETestApp.xcworkspace -scheme E2ETestApp -configuration Release -sdk iphonesimulator -derivedDataPath ios/build/detox',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      testBinaryPath: 'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
      build:
        'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd ..',
      reversePorts: [8081],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      testBinaryPath:
        'android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk',
      build:
        'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release && cd ..',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      // CI pins the simulator it boots early (DETOX_IOS_UDID), so Detox reuses it.
      device: process.env.DETOX_IOS_UDID
        ? { id: process.env.DETOX_IOS_UDID }
        : { type: process.env.DETOX_IOS_DEVICE || 'iPhone 16 Pro' },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: process.env.DETOX_AVD_NAME || 'Pixel_API_37' },
    },
    attached: {
      type: 'android.attached',
      device: { adbName: process.env.DETOX_ADB_NAME || '.*' },
    },
  },
  configurations: {
    'ios.sim.debug': { app: 'ios.debug', device: 'simulator' },
    'ios.sim.release': { app: 'ios.release', device: 'simulator' },
    'android.emu.debug': { app: 'android.debug', device: 'emulator' },
    'android.emu.release': { app: 'android.release', device: 'emulator' },
    'android.att.debug': { app: 'android.debug', device: 'attached' },
    'android.att.release': { app: 'android.release', device: 'attached' },
  },
};
