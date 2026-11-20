#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// A generated thumbnail, as `StreamVideoThumbnail.mm` reads it. `StreamVideoThumbnailResult`
/// (Swift) conforms to it.
@protocol StreamVideoThumbnailResultAPI <NSObject>

@property (nonatomic, readonly, copy, nullable) NSString *uri;
@property (nonatomic, readonly, copy, nullable) NSString *error;

@end

/// What `StreamVideoThumbnail.mm` calls on `StreamVideoThumbnailGenerator` (Swift), which conforms
/// to it.
@protocol StreamVideoThumbnailGeneratorAPI <NSObject>

+ (void)generateThumbnailsWithUrls:(NSArray<NSString *> *)urls
                        completion:(void (^)(NSArray<id<StreamVideoThumbnailResultAPI>> *thumbnails))completion
    NS_SWIFT_NAME(generateThumbnails(urls:completion:));

@end

NS_ASSUME_NONNULL_END
