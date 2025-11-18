#pragma once

#include <react/renderer/components/AiComponentsReactNative/Props.h>
#include <react/utils/ContextContainer.h>
#include <react/renderer/core/LayoutConstraints.h>

namespace facebook::react {

class PerfTextMeasurementManager {
 public:
  PerfTextMeasurementManager(
    const std::shared_ptr<const ContextContainer> &contextContainer)
      : contextContainer_(contextContainer) {}

  // Props type name comes from codegen, hence why we don't override Props.h
  Size measure(
    SurfaceId surfaceId,
    LayoutConstraints layoutConstraints,
    const PerfTextProps &props) const;

 private:
  const std::shared_ptr<const ContextContainer> contextContainer_;
};

} // namespace facebook::react
