// swift-tools-version: 6.0

import Foundation
import PackageDescription

// Swift Package Manager manifest, for apps that React Native 0.88+ builds with SwiftPM
// (`npx react-native spm`). CocoaPods builds use stream-chat-react-native.podspec and never read it.
//
// React Native links this package through `<app>/ios/build/generated/autolinking/libs/StreamChatReactNative`,
// so the relative paths below point at the app's prebuilt React Native and codegen packages.
// `ios/shared/` is synced from `package/shared-native/ios`. The manifest is not in `ios/` because the
// podspec's `ios/**/*.swift` glob would compile it.

let packageName = "StreamChatReactNative"
let swiftTargetName = "StreamChatReactNativeSwift"
// Files in `ios/` that are not part of the module.
let nonSources = ["StreamChatReactNative.xcodeproj"]

// SwiftPM cannot compile Swift and Objective-C++ in one target, so the Swift sources get their own
// target. The Objective-C++ glue reaches the Swift classes through the Objective-C protocols in
// `ios/shared/interfaces`, which the Swift classes conform to, instead of the generated Swift header.
// The protocols target has the same name in both wrappers, so the shared Swift sources can import it.
let interfacesTargetName = "StreamChatNativeInterfaces"
let swiftSources = [
  "AIAgentModule.swift",
  "AIDictationModule.swift",
  "StreamMultipartUploadBodyStream.swift",
  "StreamMultipartUploadManager.swift",
  "StreamMultipartUploadModels.swift",
  "StreamMultipartUploadProgress.swift",
  "StreamMultipartUploadSourceResolver.swift",
  "StreamMultipartUploaderBridge.swift",
  "StreamShimmerView.swift",
  "StreamVideoThumbnailGenerator.swift",
]

// Dictation (`ai-components` speech-to-text) references the Speech framework, and App Store Connect
// requires a speech recognition usage description from every app whose binary does. It is therefore
// only compiled into apps that opt in, through either of (both also work with CocoaPods):
//   - `"stream-chat": { "enableDictation": true }` in the app's package.json
//   - the `STREAM_CHAT_ENABLE_DICTATION=1` environment variable
// Xcode caches what this manifest decides, so after changing either one, reset the package caches
// (File > Packages > Reset Package Caches, or delete the DerivedData folder) before building.

// Reads the `stream-chat` section of the closest package.json above this package, which is the app's.
func appStreamChatConfig() -> [String: Any] {
  var directory = URL(fileURLWithPath: Context.packageDirectory).standardizedFileURL
  while directory.path != "/" {
    let packageJSON = directory.appendingPathComponent("package.json")
    if let data = FileManager.default.contents(atPath: packageJSON.path),
      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
      let config = json["stream-chat"] as? [String: Any]
    {
      return config
    }
    directory = directory.deletingLastPathComponent()
  }
  return [:]
}

let dictationEnabled =
  (appStreamChatConfig()["enableDictation"] as? Bool) == true
  || ["1", "true"].contains(Context.environment["STREAM_CHAT_ENABLE_DICTATION"]?.lowercased() ?? "")
let dictationSwiftSources = ["AIDictationModule.swift"]
let dictationObjCSources = ["shared/AIDictation.h", "shared/AIDictation.mm"]

let package = Package(
  name: packageName,
  platforms: [.iOS("15.1")],
  products: [
    .library(name: packageName, targets: [packageName]),
  ],
  dependencies: [
    .package(name: "ReactNative", path: "../../../../xcframeworks"),
    .package(name: "React-GeneratedCode", path: "../../../ios"),
  ],
  targets: [
    .target(
      name: interfacesTargetName,
      path: "ios/shared/interfaces",
      publicHeadersPath: "include"
    ),
    .target(
      name: swiftTargetName,
      dependencies: [.target(name: interfacesTargetName)],
      path: "ios/shared",
      sources: swiftSources.filter { dictationEnabled || !dictationSwiftSources.contains($0) },
      linkerSettings: [.linkedFramework("AuthenticationServices")]
        + (dictationEnabled ? [.linkedFramework("Speech")] : [])
    ),
    .target(
      name: packageName,
      dependencies: [
        .target(name: interfacesTargetName),
        .target(name: swiftTargetName),
        .product(name: "ReactHeaders", package: "ReactNative"),
        .product(name: "ReactNativeHeaders", package: "ReactNative"),
        .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
        .product(name: "ReactAppHeaders", package: "React-GeneratedCode"),
      ],
      path: "ios",
      exclude: nonSources
        + ["shared/interfaces"]
        + swiftSources.map { "shared/\($0)" }
        + (dictationEnabled ? [] : dictationObjCSources),
      // Nothing imports this module (React Native looks the modules and views up by class name), but
      // SwiftPM requires the public headers directory to exist.
      publicHeadersPath: "shared",
      cSettings: [.define("RCT_NEW_ARCH_ENABLED", to: "1")],
      cxxSettings: [
        .define("RCT_NEW_ARCH_ENABLED", to: "1"),
        // Fabric C++ has to match the NDEBUG state of the prebuilt React framework.
        .define("DEBUG", .when(configuration: .debug)),
        .define("NDEBUG", .when(configuration: .release)),
      ],
      linkerSettings: [
        .linkedFramework("UIKit"),
        .linkedFramework("Foundation"),
      ]
    ),
  ],
  // The language mode CocoaPods compiles these sources with.
  swiftLanguageModes: [.v5],
  cxxLanguageStandard: .cxx20
)
