#ifdef RCT_NEW_ARCH_ENABLED
#if __has_include("StreamChatReactNativeSpec.h")
#import "StreamChatReactNativeSpec.h"
#else
#import <StreamChatReactNativeSpec/StreamChatReactNativeSpec.h>
#endif
#else
#import <React/RCTBridgeModule.h>
#endif

#ifdef RCT_NEW_ARCH_ENABLED
@interface StreamChatReactNative : NSObject <NativeStreamChatReactNativeSpec>
#else
@interface StreamChatReactNative : NSObject <RCTBridgeModule>
#endif

@end
