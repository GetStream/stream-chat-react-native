#import "AIDictation.h"

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
#error "Unable to import generated Swift header for AIDictation."
#endif

static NSString *const AIDictationOnStateEventName = @"AIDictationOnState";
static NSString *const AIDictationOnResultEventName = @"AIDictationOnResult";
static NSString *const AIDictationOnErrorEventName = @"AIDictationOnError";

@interface AIDictation () <AIDictationEventSink>
@end

@implementation AIDictation {
  AIDictationModule *moduleInstance;
}

// Registered here rather than through `codegenConfig.ios.modulesProvider`: the provider list is
// resolved at startup and reports a missing class as an error, while this module is only compiled
// in when dictation is enabled.
RCT_EXPORT_MODULE(AIDictation)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    moduleInstance = [AIDictationModule new];
    moduleInstance.eventSink = self;
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ AIDictationOnStateEventName, AIDictationOnResultEventName, AIDictationOnErrorEventName ];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeAIDictationSpecJSI>(params);
}

- (void)start:(JS::NativeAIDictation::DictationStartOptions &)options
{
  NSMutableDictionary *dict = [NSMutableDictionary dictionary];

  auto interimOpt = options.interimResults();
  if (interimOpt.has_value()) {
    dict[@"interimResults"] = @(*interimOpt);
  }

  auto langOpt = options.language();
  if (langOpt && langOpt != (id)kCFNull) {
    dict[@"language"] = langOpt;
  }

  auto silenceOpt = options.silenceTimeoutMs();
  if (silenceOpt.has_value()) {
    dict[@"silenceTimeoutMs"] = @(*silenceOpt);
  }

  [moduleInstance startWithOptions:dict eventEmitter:self];
}

- (void)stop
{
  [moduleInstance stop];
}

- (void)cancel
{
  [moduleInstance cancel];
}

- (NSNumber *)isRecording
{
  return @([moduleInstance isRecording]);
}

#pragma mark - AIDictationEventSink

- (void)emitOnState:(NSDictionary *)value
{
  [self sendEventWithName:AIDictationOnStateEventName body:value];
}

- (void)emitOnResult:(NSDictionary *)value
{
  [self sendEventWithName:AIDictationOnResultEventName body:value];
}

- (void)emitOnError:(NSDictionary *)value
{
  [self sendEventWithName:AIDictationOnErrorEventName body:value];
}

@end

#endif
