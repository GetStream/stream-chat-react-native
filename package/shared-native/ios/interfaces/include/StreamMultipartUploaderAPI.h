#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// What `StreamMultipartUploader.mm` calls on `StreamMultipartUploaderBridge` (Swift), which
/// conforms to it.
@protocol StreamMultipartUploaderBridgeAPI <NSObject>

+ (void)uploadMultipartWithUploadId:(NSString *)uploadId
                                url:(NSString *)url
                             method:(NSString *)method
                            headers:(NSArray<NSDictionary<NSString *, NSString *> *> *)headers
                              parts:(NSArray<NSDictionary<NSString *, id> *> *)parts
                           progress:(nullable NSDictionary<NSString *, id> *)progress
                          timeoutMs:(nullable NSNumber *)timeoutMs
                         onProgress:(void (^)(NSNumber *loaded, NSNumber *_Nullable total))onProgress
                         completion:(void (^)(NSDictionary *_Nullable response,
                                              NSError *_Nullable error))completion
    NS_SWIFT_NAME(uploadMultipart(uploadId:url:method:headers:parts:progress:timeoutMs:onProgress:completion:));

+ (void)cancelUploadWithUploadId:(NSString *)uploadId NS_SWIFT_NAME(cancelUpload(uploadId:));

@end

NS_ASSUME_NONNULL_END
