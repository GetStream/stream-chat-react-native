#import "AIAgent.h"

#ifdef RCT_NEW_ARCH_ENABLED

#import "AIAgentAPI.h"

// Implemented in AIAgentModule.swift.
@interface AIAgentModule : NSObject <AIAgentModuleAPI>
@end

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
