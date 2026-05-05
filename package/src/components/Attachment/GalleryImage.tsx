import React from 'react';
import {
  Image,
  ImageErrorEvent,
  ImageProps,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useLoadingImage } from '../../hooks/useLoadingImage';
import { useStableCallback } from '../../hooks/useStableCallback';

import { getUrlWithoutParams, isLocalUrl, makeImageCompatibleUrl } from '../../utils/utils';

export type GalleryImageWithContextProps = GalleryImageProps & {
  ImageComponent?: React.ComponentType<ImageProps>;
};

export const GalleryImageWithContext = (props: GalleryImageWithContextProps) => {
  const {
    accessibilityLabel = 'Gallery Image',
    ImageComponent = Image,
    uri,
    style,
    ...rest
  } = props;

  // Caching image components such as FastImage will not work with local images.
  // This for the case of local uris, we use the default Image component.
  if (!isLocalUrl(uri)) {
    return (
      <ImageComponent
        {...rest}
        accessibilityLabel={accessibilityLabel}
        style={[styles.image, style]}
        source={{
          uri: makeImageCompatibleUrl(uri),
        }}
      />
    );
  }

  return (
    <Image
      {...rest}
      accessibilityLabel={accessibilityLabel}
      style={[styles.image, style]}
      source={{
        uri: makeImageCompatibleUrl(uri),
      }}
    />
  );
};

export const MemoizedGalleryImage = React.memo(
  GalleryImageWithContext,
  (prevProps, nextProps) =>
    getUrlWithoutParams(prevProps.uri) === getUrlWithoutParams(nextProps.uri),
);
export type GalleryImageProps = Omit<ImageProps, 'height' | 'source'> & {
  uri: string;
};

export const GalleryImage = (props: GalleryImageProps) => {
  const { ImageComponent } = useComponentsContext();

  return <MemoizedGalleryImage ImageComponent={ImageComponent} {...props} />;
};

export type LoadableGalleryImageProps = Pick<
  GalleryImageProps,
  'accessibilityLabel' | 'resizeMode' | 'uri'
> & {
  children?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  localId?: string;
};

export const LoadableGalleryImage = ({
  accessibilityLabel = 'Gallery Image',
  children,
  containerStyle,
  imageStyle,
  localId,
  resizeMode,
  uri,
}: LoadableGalleryImageProps) => {
  const { AttachmentUploadIndicator, ImageLoadingFailedIndicator, ImageLoadingIndicator } =
    useComponentsContext();
  const {
    isLoadingImage,
    isLoadingImageError,
    onReloadImage,
    setLoadingImage,
    setLoadingImageError,
  } = useLoadingImage();

  const onLoadStart = useStableCallback(() => {
    setLoadingImageError(false);
    setLoadingImage(true);
  });
  const onLoad = useStableCallback(() => {
    setTimeout(() => {
      setLoadingImage(false);
      setLoadingImageError(false);
    }, 0);
  });
  const onError = useStableCallback(({ nativeEvent: { error } }: ImageErrorEvent) => {
    console.warn(error);
    setLoadingImage(false);
    setLoadingImageError(true);
  });

  return (
    <View style={[styles.image, containerStyle]}>
      {isLoadingImageError ? (
        <ImageLoadingFailedIndicator onReloadImage={onReloadImage} />
      ) : (
        <>
          <GalleryImage
            accessibilityLabel={accessibilityLabel}
            onError={onError}
            onLoad={onLoad}
            onLoadStart={onLoadStart}
            resizeMode={resizeMode}
            style={imageStyle}
            uri={uri}
          />
          {children}
          {isLoadingImage ? <ImageLoadingIndicator /> : null}
          <AttachmentUploadIndicator localId={localId} sourceUrl={uri} variant='overlay' />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    flex: 1,
  },
});
