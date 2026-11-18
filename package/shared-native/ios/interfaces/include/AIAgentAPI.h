#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// What `AIAgent.mm` calls on `AIAgentModule` (Swift), which conforms to it.
@protocol AIAgentModuleAPI <NSObject>

+ (NSString *)installId;

- (void)openAuthSessionWithUrl:(NSString *)url
                callbackScheme:(NSString *)callbackScheme
                    completion:(void (^)(NSString *_Nullable callback, NSString *_Nullable error))completion
    NS_SWIFT_NAME(openAuthSession(url:callbackScheme:completion:));

@end

NS_ASSUME_NONNULL_END
