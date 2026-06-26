#include "StreamMessageListViewShadowNode.h"

#include <react/renderer/graphics/Transform.h>

namespace facebook::react {

extern const char StreamMessageListViewComponentName[] = "StreamMessageListView";

Point StreamMessageListViewShadowNode::getContentOriginOffset(
    bool includeTransform) const {
  auto stateData = getStateData();
  auto contentOffset = stateData.contentOffset;
  auto transform = includeTransform ? getTransform() : Transform::Identity();
  auto result =
      transform * Vector{-contentOffset.x, -contentOffset.y, 0.0f, 1.0f};
  return {result.x, result.y};
}

} // namespace facebook::react
