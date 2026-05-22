import React from 'react';
import { Image, ImageProps, ImageURISource, View } from 'react-native';

import { SvgUri } from 'react-native-svg';

/**
 * Returns true if `uri` points to an SVG (either by `.svg` extension or by
 * `image/svg+xml` data-URI prefix). Exported so other surfaces (e.g. the
 * fullscreen image gallery) can branch on SVG without re-implementing the
 * detection.
 */
export const isSvgUri = (uri: string | null | undefined): boolean => {
  if (typeof uri !== 'string' || uri.length === 0) {
    return false;
  }
  const lower = uri.toLowerCase();
  if (lower.startsWith('data:image/svg+xml')) {
    return true;
  }
  const pathOnly = lower.split('#')[0].split('?')[0];
  return pathOnly.endsWith('.svg');
};

const getSvgRemoteUri = (source: ImageProps['source']): string | null => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return null;
  }

  const { uri } = source as ImageURISource;
  return isSvgUri(uri) ? (uri as string) : null;
};

/**
 * Default `ImageComponent` for the SDK. Behaves exactly like RN's `Image` for
 * raster sources, but transparently renders SVG URIs (`.svg`, `image/svg+xml`
 * data URIs) via `SvgUri` from `react-native-svg`. Integrators who override
 * `ImageComponent` with a custom image library (e.g. FastImage) are
 * responsible for SVG handling in their override.
 */
export const SvgAwareImage = (props: ImageProps) => {
  const svgUri = getSvgRemoteUri(props.source);

  if (!svgUri) {
    return <Image {...props} />;
  }

  const { accessibilityLabel, onError, onLoad, onLoadEnd, style, testID } = props;

  return (
    <View accessibilityLabel={accessibilityLabel} style={style} testID={testID}>
      <SvgUri
        height='100%'
        onError={(error) => {
          onError?.({ nativeEvent: { error } } as never);
          onLoadEnd?.();
        }}
        onLoad={() => {
          onLoad?.({} as never);
          onLoadEnd?.();
        }}
        uri={svgUri}
        width='100%'
      />
    </View>
  );
};
