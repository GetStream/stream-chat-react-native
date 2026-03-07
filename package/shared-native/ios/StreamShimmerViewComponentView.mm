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
    _shimmerView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [self insertSubview:_shimmerView atIndex:0];
  }

  return self;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self sendSubviewToBack:_shimmerView];
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const StreamShimmerViewProps>(props);

  UIColor *baseColor = RCTUIColorFromSharedColor(newProps.baseColor) ?: [UIColor clearColor];
  UIColor *highlightColor =
      RCTUIColorFromSharedColor(newProps.highlightColor) ?: [UIColor colorWithWhite:1 alpha:0.35];
  UIColor *gradientColor = RCTUIColorFromSharedColor(newProps.gradientColor) ?: [UIColor whiteColor];

  [_shimmerView applyWithBaseColor:baseColor
                    highlightColor:highlightColor
                     gradientColor:gradientColor
                     gradientWidth:(CGFloat)MAX(newProps.gradientWidth, 0)
                    gradientHeight:(CGFloat)MAX(newProps.gradientHeight, 0)
                           enabled:newProps.enabled];

  [super updateProps:props oldProps:oldProps];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  [_shimmerView stopAnimation];
}

@end

#endif
