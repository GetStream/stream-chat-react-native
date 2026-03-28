#import "StreamVideoThumbnail.h"

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
#error "Unable to import generated Swift header for StreamVideoThumbnail."
#endif

@implementation StreamVideoThumbnail

RCT_EXPORT_MODULE(StreamVideoThumbnail)

RCT_REMAP_METHOD(createVideoThumbnails, urls:(NSArray<NSString *> *)urls resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
  [self createVideoThumbnails:urls resolve:resolve reject:reject];
}

- (void)createVideoThumbnails:(NSArray<NSString *> *)urls
                      resolve:(RCTPromiseResolveBlock)resolve
                       reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    NSError *error = nil;
    NSArray<NSString *> *thumbnails = [StreamVideoThumbnailGenerator generateThumbnailsWithUrls:urls error:&error];
    if (error != nil) {
      reject(@"stream_video_thumbnail_error", error.localizedDescription, error);
      return;
    }

    @try {
      resolve(thumbnails);
    } @catch (NSException *exception) {
      reject(@"stream_video_thumbnail_error", exception.reason, nil);
    }
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeStreamVideoThumbnailSpecJSI>(params);
}

@end

#endif
