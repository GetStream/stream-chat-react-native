#pragma once

#include "StreamMessageListViewState.h"

#include <react/renderer/components/StreamChatReactNativeSpec/EventEmitters.h>
#include <react/renderer/components/StreamChatReactNativeSpec/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {

extern const char StreamMessageListViewComponentName[];

/*
 * Custom ShadowNode for <StreamMessageListView>. Reuses codegen's component name,
 * Props and EventEmitter (emitted under interfaceOnly:true), but supplies our own
 * State (the native scroll offset) and overrides getContentOriginOffset so that the
 * shadow tree accounts for our custom OverScroller scroll — which Fabric's
 * View.scrollTo-blind coordinate math otherwise misses for any scrolled cell.
 *
 * NOTE (productionization / 0.76-0.79): ConcreteViewShadowNode took a trailing
 * `bool usesMapBufferForStateData` template arg before RN 0.80. To support 0.76-0.79,
 * append `, false` to the template args behind a `#if REACT_NATIVE_MINOR_VERSION < 80`
 * guard — but ensure that macro is defined in EVERY target that includes this header
 * (incl. the app's autolinked registration glue), not just our CMake target. The spike
 * targets 0.85 (4-arg form).
 */
class StreamMessageListViewShadowNode final
    : public ConcreteViewShadowNode<
          StreamMessageListViewComponentName,
          StreamMessageListViewProps,
          StreamMessageListViewEventEmitter,
          StreamMessageListViewState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  Point getContentOriginOffset(bool includeTransform) const override;
};

} // namespace facebook::react
