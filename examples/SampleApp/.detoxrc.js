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
      binaryPath: 'ios/build/detox/Build/Products/Debug-iphonesimulator/SampleApp.app',
      build:
        'xcodebuild -workspace ios/SampleApp.xcworkspace -scheme SampleApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build/detox',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/detox/Build/Products/Release-iphonesimulator/SampleApp.app',
      build:
        'xcodebuild -workspace ios/SampleApp.xcworkspace -scheme SampleApp -configuration Release -sdk iphonesimulator -derivedDataPath ios/build/detox',
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
      device: { type: process.env.DETOX_IOS_DEVICE || 'iPhone 16 Pro' },
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
