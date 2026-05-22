package com.streamchatreactnative;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.TurboReactPackage;
import com.facebook.react.uimanager.ViewManager;

import java.util.HashMap;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class StreamChatReactNativePackage extends TurboReactPackage {
  private static final String STREAM_MULTIPART_UPLOADER_MODULE = "StreamMultipartUploader";
  private static final String STREAM_VIDEO_THUMBNAIL_MODULE = "StreamVideoThumbnail";

  @Nullable
  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
    if (name.equals(StreamChatReactNativeModule.NAME)) {
        return new StreamChatReactNativeModule(reactContext);
    } else if (name.equals(STREAM_MULTIPART_UPLOADER_MODULE)) {
        return createNewArchModule(
                "com.streamchatreactnative.StreamMultipartUploaderModule",
                reactContext
        );
    } else if (name.equals(STREAM_VIDEO_THUMBNAIL_MODULE)) {
        return createNewArchModule(
                "com.streamchatreactnative.StreamVideoThumbnailModule",
                reactContext
        );
    } else {
        return null;
    }
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return () -> {
      final Map<String, ReactModuleInfo> moduleInfos = new HashMap<>();
      moduleInfos.put(
              StreamChatReactNativeModule.NAME,
              new ReactModuleInfo(
                      StreamChatReactNativeModule.NAME,
                      StreamChatReactNativeModule.NAME,
                      false, // canOverrideExistingModule
                      false, // needsEagerInit
                      true, // hasConstants
                      false, // isCxxModule
                      true // isTurboModule
      ));
      moduleInfos.put(
              STREAM_MULTIPART_UPLOADER_MODULE,
              new ReactModuleInfo(
                      STREAM_MULTIPART_UPLOADER_MODULE,
                      STREAM_MULTIPART_UPLOADER_MODULE,
                      false, // canOverrideExistingModule
                      false, // needsEagerInit
                      false, // hasConstants
                      false, // isCxxModule
                      true // isTurboModule
      ));
      moduleInfos.put(
              STREAM_VIDEO_THUMBNAIL_MODULE,
              new ReactModuleInfo(
                      STREAM_VIDEO_THUMBNAIL_MODULE,
                      STREAM_VIDEO_THUMBNAIL_MODULE,
                      false, // canOverrideExistingModule
                      false, // needsEagerInit
                      false, // hasConstants
                      false, // isCxxModule
                      true // isTurboModule
      ));
      return moduleInfos;
    };
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Collections.<ViewManager>singletonList(new StreamShimmerViewManager());
  }

  @Nullable
  private NativeModule createNewArchModule(
          String className,
          ReactApplicationContext reactContext
  ) {
    try {
      Class<?> moduleClass = Class.forName(className);
      return (NativeModule) moduleClass
              .getConstructor(ReactApplicationContext.class)
              .newInstance(reactContext);
    } catch (Throwable ignored) {
      return null;
    }
  }
}
