import * as React from 'react';

import { Image, ImageBackgroundProps, ImageProps, StyleSheet, View } from 'react-native';

/**
 * Drop-in replacement for `Image` that supports nesting views, adapted from React Native's
 * `ImageBackground`:
 * https://github.com/facebook/react-native/blob/main/Libraries/Image/ImageBackground.js
 *
 * It is a function component without ref handling; an optional `ImageComponent` renders the image.
 */

export const ImageBackground: React.ComponentType<
  ImageBackgroundProps & {
    ImageComponent?: React.ComponentType<ImageProps>;
  }
> = (props) => {
  const {
    children,
    ImageComponent = Image,
    imageStyle,
    importantForAccessibility,
    style,
    ...rest
  } = props;

  const flattenedStyle = StyleSheet.flatten(style);
  return (
    <View
      accessibilityIgnoresInvertColors={true}
      importantForAccessibility={importantForAccessibility}
      style={style}
    >
      <ImageComponent
        {...rest}
        importantForAccessibility={importantForAccessibility}
        style={[
          StyleSheet.absoluteFill,
          {
            // `Image` overwrites width and height styles, which conflicts with the container's, so
            // they are re-applied here. Can go once `Image` supports intrinsic content size.
            height: flattenedStyle?.height,
            width: flattenedStyle?.width,
          },
          imageStyle,
        ]}
      />
      {children}
    </View>
  );
};
