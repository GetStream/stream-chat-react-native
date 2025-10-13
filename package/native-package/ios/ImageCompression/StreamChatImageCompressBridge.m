// StreamChatImageCompressBridge.m

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(StreamChatImageCompress, NSObject)

RCT_EXTERN_METHOD(compressImage:(NSString *)imageURL
                  options:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
