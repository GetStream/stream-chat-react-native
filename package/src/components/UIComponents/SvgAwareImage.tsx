import React from 'react';
import { Image, ImageProps, View } from 'react-native';

import { SvgUri } from 'react-native-svg';

import { useIsSvg } from '../../hooks/useIsSvg';

const getSourceUri = (source: ImageProps['source']): string | undefined => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return undefined;
  }
  return source.uri;
};

/**
 * Default `ImageComponent` for the SDK. Behaves exactly like RN's `Image` for
 * raster sources, but transparently renders SVG URIs (`.svg`, `image/svg+xml`
 * data URIs) via `SvgUri` from `react-native-svg`. Integrators who override
 * `ImageComponent` with a custom image library (e.g. FastImage) are
 * responsible for SVG handling in their override.
 */
export const SvgAwareImage = (props: ImageProps) => {
  const uri = getSourceUri(props.source);
  const isSvg = useIsSvg(uri);

  if (!isSvg || !uri) {
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
        uri={uri}
        width='100%'
      />
    </View>
  );
};
