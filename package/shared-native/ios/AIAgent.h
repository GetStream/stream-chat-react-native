#ifdef RCT_NEW_ARCH_ENABLED

#if __has_include("StreamChatReactNativeSpec.h")
#import "StreamChatReactNativeSpec.h"
#elif __has_include("StreamChatExpoSpec.h")
#import "StreamChatExpoSpec.h"
#else
#error "Unable to find generated codegen spec header for AIAgent."
#endif

// This install's identifier and the sign-ins of tool calls, for the `ai-components` agent views.
// The implementation lives in AIAgentModule.swift.
@interface AIAgent : NSObject <NativeAIAgentSpec>
@end

#endif
