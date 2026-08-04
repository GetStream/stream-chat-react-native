import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore
import FirebaseMessaging

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  // Unused with the scene lifecycle (SceneDelegate owns the window), but Firebase's
  // app delegate proxy (GULAppDelegateSwizzler) exposes the optional `window` selector,
  // so UIKit calls it and crashes if the property is missing.
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  // Kept for SceneDelegate, which starts React Native once the scene connects
  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?

  func application(
      _ application: UIApplication,
      didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
      let delegate = ReactNativeDelegate()
      let factory = RCTReactNativeFactory(delegate: delegate)
      delegate.dependencyProvider = RCTAppDependencyProvider()
      FirebaseApp.configure()
   
      reactNativeDelegate = delegate
      reactNativeFactory = factory
      self.launchOptions = launchOptions
   
      return true
    }

  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
      // Pass the device token to FCM
      Messaging.messaging().apnsToken = deviceToken
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
