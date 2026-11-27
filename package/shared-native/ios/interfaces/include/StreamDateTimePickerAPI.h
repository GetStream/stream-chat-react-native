#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/// The interface through which `StreamDateTimePicker.mm` reaches the Swift
/// `StreamDateTimePickerPresenter`.
@protocol StreamDateTimePickerPresenterAPI <NSObject>

/// Presents the picker above the controller returned by `presenter` and calls `completion` once,
/// with the selected moment in milliseconds or nil when the picker is cancelled or cannot be shown.
+ (void)presentWithMode:(NSString *)mode
                  value:(double)value
            minimumDate:(nullable NSNumber *)minimumDate
            maximumDate:(nullable NSNumber *)maximumDate
           confirmLabel:(NSString *)confirmLabel
            cancelLabel:(NSString *)cancelLabel
              presenter:(UIViewController *_Nullable (^)(void))presenter
             completion:(void (^)(NSNumber *_Nullable result))completion
    NS_SWIFT_NAME(present(mode:value:minimumDate:maximumDate:confirmLabel:cancelLabel:presenter:completion:));

/// Dismisses a picker that is still shown, which resolves it as cancelled.
+ (void)dismissPresented NS_SWIFT_NAME(dismissPresented());

@end

NS_ASSUME_NONNULL_END
