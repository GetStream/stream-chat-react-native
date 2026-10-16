const { createRunOncePlugin, withAppDelegate } = require('@expo/config-plugins');

// Expo SDK 58 moved `factory.startReactNative(...)` out of AppDelegate.swift and into
// SceneDelegate.swift (the iOS 27 SDK requires the scene-based life cycle). The
// @react-native-firebase/app config plugin (checked up to 26.4.0) anchors `FirebaseApp.configure()`
// on that call, so it now skips the insertion with a warning and Firebase is never configured.
// Until upstream handles the new template, insert it right before `super.application(...)`.
// Must be listed after `@react-native-firebase/app`, which adds the `FirebaseCore` import.
const CONFIGURE_CALL = 'FirebaseApp.configure()';
const ANCHOR =
  /^(\s*)return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)/m;

const withFirebaseAppDelegate = (config) =>
  withAppDelegate(config, (config) => {
    const { contents, language } = config.modResults;
    if (language !== 'swift' || contents.includes(CONFIGURE_CALL)) {
      return config;
    }
    if (!ANCHOR.test(contents)) {
      throw new Error(
        'firebaseAppDelegatePlugin: could not find `return super.application(...)` in AppDelegate.swift.',
      );
    }
    config.modResults.contents = contents.replace(
      ANCHOR,
      (match, indent) => `${indent}${CONFIGURE_CALL}\n${match}`,
    );
    return config;
  });

module.exports = createRunOncePlugin(
  withFirebaseAppDelegate,
  'firebase-app-delegate-plugin',
  '0.0.1',
);
