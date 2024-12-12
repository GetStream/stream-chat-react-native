import * as React from 'react';

import { Image, ImageBackgroundProps, ImageProps, StyleSheet, View } from 'react-native';

/**
 * DISCLAIMER: This component has been pretty-much copied from react-native's source code
 * https://github.com/facebook/react-native/blob/main/Libraries/Image/ImageBackground.js
 * Few modifications have been done such as converting to functional component, removing ref related logic (since its not required).
 * Also support for prop `ImageComponent` has been introduced to allow rendering custom
 * component instead of `Image`.
 *
 *
 * Very simple drop-in replacement for <Image> which supports nesting views.
 *
 * ```ReactNativeWebPlayer
 * import React, { Component } from 'react';
 * import { AppRegistry, View, ImageBackground, Text } from 'react-native';
 *
 * class DisplayAnImageBackground extends Component {
 *   render() {
 *     return (
 *       <ImageBackground
 *         style={{width: 50, height: 50}}
 *         source={{uri: 'https://reactnative.dev/img/opengraph.png'}}
 *       >
 *         <Text>React</Text>
 *       </ImageBackground>
 *     );
 *   }
 * }
 *
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
            // Temporary Workaround:
            // Current (imperfect yet) implementation of <Image> overwrites width and height styles
            // (which is not quite correct), and these styles conflict with explicitly set styles
            // of <ImageBackground> and with our internal layout model here.
            // So, we have to proxy/reapply these styles explicitly for actual <Image> component.
            // This workaround should be removed after implementing proper support of
            // intrinsic content size of the <Image>.
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
