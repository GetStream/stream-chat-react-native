package com.streamchatreactnative;

import android.annotation.SuppressLint;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.AsyncTask;
import androidx.annotation.Nullable;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.GuardedAsyncTask;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReactMethod;


import java.io.File;
import java.io.IOException;
import java.util.UUID;

public class StreamChatReactNativeModule extends StreamChatReactNativeSpec {
  public static final String NAME = "StreamChatReactNative";

  StreamChatReactNativeModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void createResizedImage(String uri, double width, double height, String format, double quality, String mode, boolean onlyScaleDown, Double rotation, @Nullable String outputPath, @Nullable Double backgroundColor, Promise promise) {
    WritableMap options = Arguments.createMap();
    options.putString("mode", mode);
    options.putBoolean("onlyScaleDown", onlyScaleDown);

    // processColor() hands us an ARGB int, but codegen boxes every JS number as a Double.
    // Double.intValue() *saturates*, so the unsigned form (white is 4294967295.0) would clamp
    // to Integer.MAX_VALUE and paint teal. Going via long truncates instead, which wraps
    // correctly for both the signed and unsigned forms processColor produces.
    final Integer argb = backgroundColor == null ? null : (int) (long) backgroundColor.doubleValue();

    // Run in guarded async task to prevent blocking the React bridge
    new GuardedAsyncTask<Void, Void>(this.getReactApplicationContext()) {
      @Override
      protected void doInBackgroundGuarded(Void... params) {
        try {
          Object response = createResizedImageWithExceptions(uri, (int) width, (int) height, format, (int) quality, rotation.intValue(), outputPath, argb, options);
          promise.resolve(response);
        }
        catch (IOException e) {
          promise.reject(e);
        }
      }
    }.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
  }

  @SuppressLint("LongLogTag")
  private Object createResizedImageWithExceptions(String imagePath, int newWidth, int newHeight,
                                                  String compressFormatString, int quality, int rotation, String outputPath,
                                                  @Nullable Integer backgroundColor,
                                                  final ReadableMap options) throws IOException {

    Bitmap.CompressFormat compressFormat = Bitmap.CompressFormat.valueOf(compressFormatString);
    Uri imageUri = Uri.parse(imagePath);

    // The background colour is applied inside the resize, as part of the same canvas pass that
    // scales the image, so no second full-size bitmap is allocated for it.
    Bitmap scaledImage = StreamChatReactNative.createResizedImage(this.getReactApplicationContext(), imageUri, newWidth, newHeight, quality, rotation,
      options.getString("mode"), options.getBoolean("onlyScaleDown"), backgroundColor);

    if (scaledImage == null) {
      throw new IOException("The image failed to be resized; invalid Bitmap result.");
    }

    // Save the resulting image
    File path = this.getReactApplicationContext().getCacheDir();
    if (outputPath != null) {
      path = new File(outputPath);
    }

    File resizedImage = StreamChatReactNative.saveImage(scaledImage, path, UUID.randomUUID().toString(), compressFormat, quality);
    WritableMap response = Arguments.createMap();

    // If resizedImagePath is empty and this wasn't caught earlier, throw.
    if (resizedImage.isFile()) {
      response.putString("path", resizedImage.getAbsolutePath());
      response.putString("uri", Uri.fromFile(resizedImage).toString());
      response.putString("name", resizedImage.getName());
      response.putDouble("size", resizedImage.length());
      response.putDouble("width", scaledImage.getWidth());
      response.putDouble("height", scaledImage.getHeight());
    } else {
      throw new IOException("Error getting resized image path");
    }


    // Clean up bitmap
    scaledImage.recycle();
    return response;
  }
}
