#import "StreamVideoThumbnail.h"

#ifdef RCT_NEW_ARCH_ENABLED

#import "StreamVideoThumbnailAPI.h"

// Implemented in StreamVideoThumbnailGenerator.swift.
@interface StreamVideoThumbnailGenerator : NSObject <StreamVideoThumbnailGeneratorAPI>
@end

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
  [StreamVideoThumbnailGenerator generateThumbnailsWithUrls:urls completion:^(NSArray<id<StreamVideoThumbnailResultAPI>> *thumbnails) {
    NSMutableArray<NSDictionary<NSString *, id> *> *payload = [NSMutableArray arrayWithCapacity:thumbnails.count];

    for (id<StreamVideoThumbnailResultAPI> thumbnail in thumbnails) {
      NSMutableDictionary<NSString *, id> *entry = [NSMutableDictionary dictionaryWithCapacity:2];
      entry[@"uri"] = thumbnail.uri ?: [NSNull null];
      entry[@"error"] = thumbnail.error ?: [NSNull null];
      [payload addObject:entry];
    }

    @try {
      resolve(payload);
    } @catch (NSException *exception) {
      reject(@"stream_video_thumbnail_error", exception.reason, nil);
    }
  }];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeStreamVideoThumbnailSpecJSI>(params);
}

@end

#endif
