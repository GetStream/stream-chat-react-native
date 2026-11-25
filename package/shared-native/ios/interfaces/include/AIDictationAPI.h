#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// Receives dictation events from `AIDictationModule` (Swift). `AIDictation.mm` implements it and
/// forwards the events to JavaScript.
@protocol AIDictationEventSink <NSObject>

- (void)emitOnState:(NSDictionary *)value NS_SWIFT_NAME(emitOnState(_:));
- (void)emitOnResult:(NSDictionary *)value NS_SWIFT_NAME(emitOnResult(_:));
- (void)emitOnError:(NSDictionary *)value NS_SWIFT_NAME(emitOnError(_:));
- (void)emitOnLevel:(NSDictionary *)value NS_SWIFT_NAME(emitOnLevel(_:));

@end

/// What `AIDictation.mm` calls on `AIDictationModule` (Swift), which conforms to it.
@protocol AIDictationModuleAPI <NSObject>

@property (nonatomic, weak, nullable) id<AIDictationEventSink> eventSink;

- (void)startWithOptions:(nullable NSDictionary *)options
            eventEmitter:(NSObject *)eventEmitter
    NS_SWIFT_NAME(startWithOptions(_:eventEmitter:));
- (void)stop;
- (void)cancel;
- (BOOL)isRecording;

@end

NS_ASSUME_NONNULL_END
