#include "PerfTextShadowNode.h"

namespace facebook::react {

extern const char PerfTextComponentName[] = "PerfText";

void PerfTextShadowNode::setMeasurementManager(
  const std::shared_ptr<PerfTextMeasurementManager> &mm) {
  ensureUnsealed();
  measurementManager_ = mm;
}

Size PerfTextShadowNode::measureContent(
  const LayoutContext &layoutContext,
  const LayoutConstraints &layoutConstraints) const {
  // Ask measurement manager, drilling props so it can size based on text, fontSize, etc.
  return measurementManager_->measure(getSurfaceId(), layoutConstraints, getConcreteProps());
}

} // namespace facebook::react
