#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTEventEmitter.h>

#if __has_include("StreamChatReactNativeSpec.h")
#import "StreamChatReactNativeSpec.h"
#elif __has_include("StreamChatExpoSpec.h")
#import "StreamChatExpoSpec.h"
#else
#error "Unable to find generated codegen spec header for StreamMultipartUploader."
#endif

@interface StreamMultipartUploader : RCTEventEmitter <NativeStreamMultipartUploaderSpec>
@end

#endif
