#ifdef RCT_NEW_ARCH_ENABLED

#if __has_include("StreamChatReactNativeSpec.h")
#import "StreamChatReactNativeSpec.h"
#elif __has_include("StreamChatExpoSpec.h")
#import "StreamChatExpoSpec.h"
#elif __has_include(<StreamChatReactNativeSpec/StreamChatReactNativeSpec.h>)
#import <StreamChatReactNativeSpec/StreamChatReactNativeSpec.h>
#elif __has_include(<StreamChatExpoSpec/StreamChatExpoSpec.h>)
#import <StreamChatExpoSpec/StreamChatExpoSpec.h>
#else
#error "Unable to find generated codegen spec header for StreamDateTimePicker."
#endif

#import <React/RCTInvalidating.h>

@interface StreamDateTimePicker : NSObject <NativeStreamDateTimePickerSpec, RCTInvalidating>
@end

#endif
