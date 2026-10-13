#include "PerfTextMeasurementManager.h"

#include <fbjni/fbjni.h>
#include <folly/dynamic.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/core/conversions.h>

using namespace facebook::jni;

namespace facebook::react {

Size PerfTextMeasurementManager::measure(
  SurfaceId surfaceId,
  LayoutConstraints layoutConstraints,
  const PerfTextProps &props) const {

  // This comes from ContextContainer set up by RN
  const auto &fabricUIManager =
    contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");

  static const auto measureMethod =
    facebook::jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
      ->getMethod<jlong(
        jint,
        jstring,
        ReadableMap::javaobject, // localData
        ReadableMap::javaobject, // props
        ReadableMap::javaobject, // state
        jfloat,
        jfloat,
        jfloat,
        jfloat)>("measure");

  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  local_ref<JString> componentName = make_jstring("PerfText");

  // Serialize relevant props. For now we'll handpick the ones we want
  // to do this for and may extend later in the future.
  folly::dynamic serializedProps = folly::dynamic::object();
  serializedProps["text"] = props.text;
  serializedProps["fontSize"] = props.fontSize;
  serializedProps["lineHeight"] = props.lineHeight;

  auto propsRNM = ReadableNativeMap::newObjectCxxArgs(serializedProps);
  local_ref<ReadableMap::javaobject> propsRM =
    make_local(reinterpret_cast<ReadableMap::javaobject>(propsRNM.get()));
  // -----------------------------------------------

  const auto measureResult = measureMethod(
    fabricUIManager,
    static_cast<jint>(surfaceId),
    componentName.get(),
    nullptr,         // localData
    propsRM.get(),   // props
    nullptr,         // state
    minimumSize.width,
    maximumSize.width,
    minimumSize.height,
    maximumSize.height
  );

  // Use RN's yogaMeassureToSize(int64_t) from conversions.h
  return yogaMeassureToSize(static_cast<int64_t>(measureResult));
}

} // namespace facebook::react


