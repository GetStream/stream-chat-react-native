#import <UIKit/UIKit.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTViewComponentView.h>
#endif

#ifndef StreamShimmerViewComponentView_h
#define StreamShimmerViewComponentView_h

NS_ASSUME_NONNULL_BEGIN

@interface StreamShimmerViewComponentView :
#ifdef RCT_NEW_ARCH_ENABLED
    RCTViewComponentView
#else
    UIView
#endif
@end

NS_ASSUME_NONNULL_END

#endif /* StreamShimmerViewComponentView_h */
