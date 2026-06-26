#pragma once

#include "StreamMessageListViewShadowNode.h"

#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

/*
 * ComponentDescriptor for <StreamMessageListView>. Registered via
 * react-native.config.js (`componentDescriptors`), which — together with
 * `interfaceOnly: true` on the JS spec — makes this win over codegen's default.
 */
class StreamMessageListViewComponentDescriptor final
    : public ConcreteComponentDescriptor<StreamMessageListViewShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
};

} // namespace facebook::react
