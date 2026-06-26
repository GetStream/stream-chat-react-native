#pragma once

#include <ReactCommon/JavaTurboModule.h>
#include <ReactCommon/TurboModule.h>
#include <jsi/jsi.h>

/**
 * Hand-written shadow of the codegen-generated aggregate header
 * (build/generated/source/codegen/jni/StreamChatReactNativeSpec.h).
 *
 * The app's autolinking.cpp does `#include <StreamChatReactNativeSpec.h>` and then registers every
 * name listed in react-native.config.js `componentDescriptors`. Our StreamMessageListView is
 * `interfaceOnly: true`, so codegen no longer declares its ComponentDescriptor — this header pulls
 * in our hand-written one so autolinking can see it. Our jni/ dir is placed ahead of the codegen dir
 * on the app target's include path via CMakeLists, so this file wins the `<StreamChatReactNativeSpec.h>`
 * lookup. This mirrors react-native-screens' rnscreens.h pattern.
 *
 * The TurboModule declarations below MUST stay in sync with the codegen aggregate if the spec's
 * native modules change. (Productionization: replace with a generated-then-augmented copy or a sync step.)
 */
#include "StreamMessageListViewComponentDescriptor.h"

namespace facebook::react {

class JSI_EXPORT NativeStreamChatReactNativeSpecJSI : public JavaTurboModule {
public:
  NativeStreamChatReactNativeSpecJSI(const JavaTurboModule::InitParams &params);
};

class JSI_EXPORT NativeStreamMultipartUploaderSpecJSI : public JavaTurboModule {
public:
  NativeStreamMultipartUploaderSpecJSI(const JavaTurboModule::InitParams &params);
};

class JSI_EXPORT NativeStreamVideoThumbnailSpecJSI : public JavaTurboModule {
public:
  NativeStreamVideoThumbnailSpecJSI(const JavaTurboModule::InitParams &params);
};

JSI_EXPORT
std::shared_ptr<TurboModule> StreamChatReactNativeSpec_ModuleProvider(const std::string &moduleName, const JavaTurboModule::InitParams &params);

} // namespace facebook::react
