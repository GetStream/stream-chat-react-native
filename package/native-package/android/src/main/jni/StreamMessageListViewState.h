#pragma once

#include <react/renderer/graphics/Point.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook::react {

/*
 * State for <StreamMessageListView>. Carries the native OverScroller scroll offset
 * into the shadow tree, so getContentOriginOffset() can shift descendant window
 * coordinates — making measureInWindow (overlay) and findNodeAtPoint (long-press
 * hit-testing) correct for scrolled cells. Pushed from Kotlin via stateWrapper.updateState.
 */
class StreamMessageListViewState final {
 public:
  StreamMessageListViewState() = default;

  Point contentOffset{};

#ifdef ANDROID
  StreamMessageListViewState(
      StreamMessageListViewState const & /*previousState*/,
      folly::dynamic data)
      : contentOffset(
            {(Float)data["contentOffsetX"].asDouble(),
             (Float)data["contentOffsetY"].asDouble()}) {}

  folly::dynamic getDynamic() const {
    return folly::dynamic::object("contentOffsetX", (double)contentOffset.x)(
        "contentOffsetY", (double)contentOffset.y);
  }

  MapBuffer getMapBuffer() const {
    return MapBufferBuilder::EMPTY();
  }
#endif
};

} // namespace facebook::react
