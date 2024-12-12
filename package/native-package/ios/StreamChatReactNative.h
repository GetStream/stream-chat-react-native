#ifdef RCT_NEW_ARCH_ENABLED
#import "StreamChatReactNativeSpec.h"
#else
#import <React/RCTBridgeModule.h>
#endif

#ifdef RCT_NEW_ARCH_ENABLED
@interface StreamChatReactNative : NSObject <NativeStreamChatReactNativeSpec>
#else
@interface StreamChatReactNative : NSObject <RCTBridgeModule>
#endif

@end
