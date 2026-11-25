#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/// What `StreamShimmerViewComponentView.mm` calls on `StreamShimmerView` (Swift), which conforms
/// to it.
@protocol StreamShimmerViewAPI <NSObject>

- (void)applyWithBaseColor:(UIColor *)baseColor
             gradientColor:(UIColor *)gradientColor
      durationMilliseconds:(double)durationMilliseconds
                   enabled:(BOOL)enabled
    NS_SWIFT_NAME(apply(baseColor:gradientColor:durationMilliseconds:enabled:));
- (void)stopAnimation;

@end

NS_ASSUME_NONNULL_END
