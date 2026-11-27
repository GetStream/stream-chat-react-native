#import "StreamDateTimePicker.h"

#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTUtils.h>

#import "StreamDateTimePickerAPI.h"

// Implemented in StreamDateTimePickerPresenter.swift.
@interface StreamDateTimePickerPresenter : NSObject <StreamDateTimePickerPresenterAPI>
@end

@implementation StreamDateTimePicker

RCT_EXPORT_MODULE(StreamDateTimePicker)

- (void)pick:(JS::NativeStreamDateTimePicker::DateTimePickerOptions &)options
     resolve:(RCTPromiseResolveBlock)resolve
      reject:(RCTPromiseRejectBlock)reject
{
  NSNumber *minimumDate = options.minimumDate().has_value() ? @(options.minimumDate().value()) : nil;
  NSNumber *maximumDate = options.maximumDate().has_value() ? @(options.maximumDate().value()) : nil;

  [StreamDateTimePickerPresenter presentWithMode:options.mode()
                                           value:options.value()
                                     minimumDate:minimumDate
                                     maximumDate:maximumDate
                                    confirmLabel:options.confirmLabel()
                                     cancelLabel:options.cancelLabel()
                                       presenter:^UIViewController * {
                                         // The topmost controller that is not being dismissed, so the
                                         // dialog also appears above a React Native <Modal>.
                                         return RCTPresentedViewController();
                                       }
                                      completion:^(NSNumber *result) {
                                        resolve(result ?: [NSNull null]);
                                      }];
}

- (void)dismiss
{
  [StreamDateTimePickerPresenter dismissPresented];
}

// Dismisses a picker that is still shown when the module is invalidated, for example on reload.
- (void)invalidate
{
  [StreamDateTimePickerPresenter dismissPresented];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeStreamDateTimePickerSpecJSI>(params);
}

@end

#endif
