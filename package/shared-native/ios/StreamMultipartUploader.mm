#import "StreamMultipartUploader.h"

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
#error "Unable to import generated Swift header for StreamMultipartUploader."
#endif

static NSString *const StreamMultipartUploadProgressEventName = @"streamMultipartUploadProgress";

static NSDictionary<NSString *, id> *StreamMultipartUploadProgressDictionary(
    const JS::NativeStreamMultipartUploader::UploadProgressConfig &progress)
{
  NSMutableDictionary<NSString *, id> *payload = [NSMutableDictionary dictionaryWithCapacity:2];

  if (progress.count().has_value()) {
    payload[@"count"] = @(progress.count().value());
  }

  if (progress.intervalMs().has_value()) {
    payload[@"intervalMs"] = @(progress.intervalMs().value());
  }

  return payload;
}

@implementation StreamMultipartUploader

RCT_EXPORT_MODULE(StreamMultipartUploader)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ StreamMultipartUploadProgressEventName ];
}

- (void)uploadMultipart:(NSString *)uploadId
                    url:(NSString *)url
                 method:(NSString *)method
                headers:(NSArray<NSDictionary<NSString *, NSString *> *> *)headers
                  parts:(NSArray<NSDictionary<NSString *, id> *> *)parts
               progress:(JS::NativeStreamMultipartUploader::UploadProgressConfig &)progress
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
  __weak __typeof__(self) weakSelf = self;
  NSDictionary<NSString *, id> *progressOptions = StreamMultipartUploadProgressDictionary(progress);

  [StreamMultipartUploaderBridge uploadMultipartWithUploadId:uploadId
                                                         url:url
                                                      method:method
                                                     headers:headers
                                                       parts:parts
                                                    progress:progressOptions
                                                  onProgress:^(NSNumber *loaded, NSNumber * _Nullable total) {
    __strong __typeof__(weakSelf) strongSelf = weakSelf;
    if (strongSelf == nil) {
      return;
    }

    dispatch_async(dispatch_get_main_queue(), ^{
      NSMutableDictionary<NSString *, id> *payload = [NSMutableDictionary dictionaryWithCapacity:3];
      payload[@"uploadId"] = uploadId;
      payload[@"loaded"] = loaded;
      payload[@"total"] = total ?: [NSNull null];
      [strongSelf sendEventWithName:StreamMultipartUploadProgressEventName body:payload];
    });
  }
                                                  completion:^(NSDictionary * _Nullable response, NSError * _Nullable error) {
    if (error != nil) {
      reject(@"stream_multipart_upload_error", error.localizedDescription, error);
      return;
    }

    resolve(response ?: @{});
  }];
}

- (void)cancelUpload:(NSString *)uploadId
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject
{
  [StreamMultipartUploaderBridge cancelUploadWithUploadId:uploadId];
  resolve(nil);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeStreamMultipartUploaderSpecJSI>(params);
}

@end

#endif
