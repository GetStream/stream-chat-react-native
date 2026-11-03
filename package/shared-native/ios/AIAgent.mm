#import "AIAgent.h"

#ifdef RCT_NEW_ARCH_ENABLED

#if __has_include(<stream_chat_react_native/stream_chat_react_native-Swift.h>)
#import <stream_chat_react_native/stream_chat_react_native-Swift.h>
#elif __has_include(<stream_chat_expo/stream_chat_expo-Swift.h>)
#import <stream_chat_expo/stream_chat_expo-Swift.h>
#elif __has_include("stream_chat_react_native-Swift.h")
#import "stream_chat_react_native-Swift.h"
#elif __has_include("stream_chat_expo-Swift.h")
#import "stream_chat_expo-Swift.h"
#else
#error "Unable to import generated Swift header for AIAgent."
#endif

@implementation AIAgent {
  AIAgentModule *moduleInstance;
}

RCT_EXPORT_MODULE(AIAgent)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    moduleInstance = [AIAgentModule new];
  }
  return self;
}

- (NSString *)installId
{
  return [AIAgentModule installId];
}

- (void)openAuthSession:(NSString *)url
         callbackScheme:(NSString *)callbackScheme
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
  [moduleInstance openAuthSessionWithUrl:url
                          callbackScheme:callbackScheme
                              completion:^(NSString *_Nullable callback, NSString *_Nullable error) {
                                if (error) {
                                  reject(@"ai_agent_auth_session", error, nil);
                                } else {
                                  resolve(callback ?: @"");
                                }
                              }];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeAIAgentSpecJSI>(params);
}

@end

#endif
