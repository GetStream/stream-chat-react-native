// AIDictation.mm

#import "AIDictation.h"
#import "AIComponentsReactNative-Swift.h"

@implementation AIDictation {
  AIDictationModule *moduleInstance;
}

- (instancetype)init {
  if (self = [super init]) {
    moduleInstance = [AIDictationModule new];
    moduleInstance.eventSink = (id<AIDictationEventSink>)self;
  }
  return self;
}

+ (NSString *)moduleName {
  return @"AIDictation";
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeAIDictationSpecJSI>(params);
}

- (void)start:(JS::NativeAIDictation::DictationStartOptions &)options {
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

- (void)stop {
  [moduleInstance stop];
}

- (void)cancel {
  [moduleInstance cancel];
}

- (BOOL)isRecording {
  return [moduleInstance isRecording];
}

@end
