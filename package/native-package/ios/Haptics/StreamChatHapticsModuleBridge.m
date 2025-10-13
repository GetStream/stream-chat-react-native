// StreamChatHapticsModuleBridge.m

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(StreamChatHapticsModule, NSObject)

RCT_EXTERN_METHOD(notificationFeedback: (NSString *)type)
RCT_EXTERN_METHOD(impactFeedback: (NSString *)type)
RCT_EXTERN_METHOD(selectionFeedback)

@end
