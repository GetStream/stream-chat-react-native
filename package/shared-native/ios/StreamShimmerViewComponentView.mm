#import "StreamShimmerViewComponentView.h"

#ifdef RCT_NEW_ARCH_ENABLED

#if __has_include(<react/renderer/components/StreamChatReactNativeSpec/ComponentDescriptors.h>)
#import <react/renderer/components/StreamChatReactNativeSpec/ComponentDescriptors.h>
#import <react/renderer/components/StreamChatReactNativeSpec/Props.h>
#import <react/renderer/components/StreamChatReactNativeSpec/RCTComponentViewHelpers.h>
#elif __has_include(<react/renderer/components/StreamChatExpoSpec/ComponentDescriptors.h>)
#import <react/renderer/components/StreamChatExpoSpec/ComponentDescriptors.h>
#import <react/renderer/components/StreamChatExpoSpec/Props.h>
#import <react/renderer/components/StreamChatExpoSpec/RCTComponentViewHelpers.h>
#else
#error "Unable to find generated codegen headers for StreamShimmerView."
#endif

#if __has_include(<stream_chat_react_native/stream_chat_react_native-Swift.h>)
#import <stream_chat_react_native/stream_chat_react_native-Swift.h>
#elif __has_include(<stream_chat_expo/stream_chat_expo-Swift.h>)
#import <stream_chat_expo/stream_chat_expo-Swift.h>
#elif __has_include("stream_chat_react_native-Swift.h")
#import "stream_chat_react_native-Swift.h"
#elif __has_include("stream_chat_expo-Swift.h")
#import "stream_chat_expo-Swift.h"
#else
#error "Unable to import generated Swift header for StreamShimmerView."
#endif

#import <React/RCTConversions.h>

using namespace facebook::react;

@interface StreamShimmerViewComponentView () <RCTStreamShimmerViewViewProtocol>
@end

// Fabric bridge for StreamShimmerView. This component view owns the native shimmer instance,
// applies codegen props, and keeps shimmer rendered as a background layer while Fabric manages
// React children. Keeping shimmer as a layer avoids child-order conflicts during mount/unmount.
@implementation StreamShimmerViewComponentView {
  StreamShimmerView *_shimmerView;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<StreamShimmerViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const StreamShimmerViewProps>();
    _props = defaultProps;

    _shimmerView = [[StreamShimmerView alloc] initWithFrame:self.bounds];
    _shimmerView.userInteractionEnabled = NO;
    [self.layer insertSublayer:_shimmerView.layer atIndex:0];
  }

  return self;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _shimmerView.frame = self.bounds;

  // Keep shimmer pinned as the layer furthest back. Some layer operations can reorder sublayers, and
  // this guard restores expected layering without touching Fabric managed child views.
  BOOL needsReinsert = _shimmerView.layer.superlayer != self.layer;
  if (!needsReinsert) {
    CALayer *firstLayer = self.layer.sublayers.firstObject;
    needsReinsert = firstLayer != _shimmerView.layer;
  }
  if (needsReinsert) {
    [self.layer insertSublayer:_shimmerView.layer atIndex:0];
  }
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const StreamShimmerViewProps>(props);

  UIColor *baseColor = RCTUIColorFromSharedColor(newProps.baseColor) ?: [UIColor colorWithWhite:1 alpha:0];
  UIColor *gradientColor = RCTUIColorFromSharedColor(newProps.gradientColor) ?: [UIColor whiteColor];

  [_shimmerView applyWithBaseColor:baseColor
                     gradientColor:gradientColor
               durationMilliseconds:newProps.duration
                           enabled:newProps.enabled];

  [super updateProps:props oldProps:oldProps];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  // Defensive cleanup for recycled cells/views so offscreen instances do not keep animating.
  [_shimmerView stopAnimation];
}

- (void)dealloc
{
  [_shimmerView stopAnimation];
}

@end

#endif
