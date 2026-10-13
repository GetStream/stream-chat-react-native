#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTEventEmitter.h>

#if __has_include("StreamChatReactNativeSpec.h")
#import "StreamChatReactNativeSpec.h"
#elif __has_include("StreamChatExpoSpec.h")
#import "StreamChatExpoSpec.h"
#else
#error "Unable to find generated codegen spec header for AIDictation."
#endif

// Speech-to-text for the `ai-components` dictation button. The implementation lives in
// AIDictationModule.swift. These files are only compiled when dictation is enabled
// (`$StreamChatEnableDictation = true` in the Podfile, or the stream-chat-expo config plugin), since
// referencing the Speech framework requires apps to declare a speech recognition usage description.
@interface AIDictation : RCTEventEmitter <NativeAIDictationSpec>
@end

#endif
