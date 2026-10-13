#pragma once

#include "PerfTextShadowNode.h"
#include "PerfTextMeasurementManager.h"

#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

class PerfTextComponentDescriptor final
  : public ConcreteComponentDescriptor<PerfTextShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
  PerfTextComponentDescriptor(
    const ComponentDescriptorParameters &parameters)
      : ConcreteComponentDescriptor(parameters),
        measurementManager_(std::make_shared<PerfTextMeasurementManager>(contextContainer_)) {}

  void adopt(ShadowNode &shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);
    auto &node = static_cast<PerfTextShadowNode &>(shadowNode);
    node.setMeasurementManager(measurementManager_);
  }

 private:
  const std::shared_ptr<PerfTextMeasurementManager> measurementManager_;
};

} // namespace facebook::react
