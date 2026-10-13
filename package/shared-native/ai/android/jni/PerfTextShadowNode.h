#pragma once

#include "PerfTextMeasurementManager.h"

#include <react/renderer/components/AiComponentsReactNative/EventEmitters.h>
#include <react/renderer/components/AiComponentsReactNative/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {

extern const char PerfTextComponentName[];

class PerfTextShadowNode final : public ConcreteViewShadowNode<
  PerfTextComponentName,
  PerfTextProps,
  PerfTextEventEmitter> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);
    return traits;
  }

  void setMeasurementManager(
    const std::shared_ptr<PerfTextMeasurementManager> &mm);

  Size measureContent(
    const LayoutContext &layoutContext,
    const LayoutConstraints &layoutConstraints) const override;

 private:
  std::shared_ptr<PerfTextMeasurementManager> measurementManager_;
};

} // namespace facebook::react
