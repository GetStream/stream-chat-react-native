import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else { return }

    let window = UIWindow(windowScene: windowScene)

    // startReactNative sets the rootViewController and makes the window key and visible
    factory.startReactNative(
      withModuleName: "SampleApp",
      in: window,
      launchOptions: appDelegate.launchOptions
    )

    self.window = window
  }
}
