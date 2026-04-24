#import "StreamHapticFeedbackModule.h"

#if __has_include(<stream_chat_react_native/stream_chat_react_native-Swift.h>)
#import <stream_chat_react_native/stream_chat_react_native-Swift.h>
#elif __has_include(<stream_chat_expo/stream_chat_expo-Swift.h>)
#import <stream_chat_expo/stream_chat_expo-Swift.h>
#elif __has_include("stream_chat_react_native-Swift.h")
#import "stream_chat_react_native-Swift.h"
#elif __has_include("stream_chat_expo-Swift.h")
#import "stream_chat_expo-Swift.h"
#else
#error "Unable to import generated Swift header for StreamHapticFeedback."
#endif

@implementation StreamHapticFeedbackModule

RCT_EXPORT_MODULE(StreamHapticFeedback)

RCT_EXPORT_METHOD(triggerHaptic:(NSString *)type)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        [StreamHapticFeedback trigger:type];
    });
}

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

@end
