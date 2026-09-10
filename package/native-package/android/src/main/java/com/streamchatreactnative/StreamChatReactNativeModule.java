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

    Bitmap scaledImage = StreamChatReactNative.createResizedImage(this.getReactApplicationContext(), imageUri, newWidth, newHeight, quality, rotation,
      options.getString("mode"), options.getBoolean("onlyScaleDown"));

    if (scaledImage == null) {
      throw new IOException("The image failed to be resized; invalid Bitmap result.");
    }

    // Flatten any alpha channel onto the requested colour before encoding, so transparent
    // areas do not come out black in a format that has no alpha channel.
    //
    // Only images that actually carry an alpha channel need this. hasAlpha() is a flag lookup
    // rather than a pixel scan, and is false for anything decoded from a JPEG, so the common
    // case - a camera photo - skips a second full-size bitmap allocation. Skipping is safe
    // because it cannot change the output: drawing a fully opaque bitmap over any colour
    // reproduces that bitmap exactly. It also removes an OOM risk that mattered: the SDK asks
    // for the source's own dimensions, so this decodes at full resolution (~48 MB for a 12 MP
    // photo), and an OOM here surfaces as an IOException that compressImage swallows - the
    // upload then silently proceeds with the original, uncompressed image.
    if (backgroundColor != null && scaledImage.hasAlpha()) {
      Bitmap flattenedImage = StreamChatReactNative.flattenOntoBackground(scaledImage, backgroundColor);

      if (flattenedImage == null) {
        scaledImage.recycle();
        throw new IOException("Unable to apply the background colour. Most likely due to not enough memory.");
      }

      scaledImage.recycle();
      scaledImage = flattenedImage;
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
