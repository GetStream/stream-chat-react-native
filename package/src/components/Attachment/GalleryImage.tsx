import React from 'react';
import { Image, ImageProps } from 'react-native';

import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';

import { getUrlWithoutParams, isLocalUrl, makeImageCompatibleUrl } from '../../utils/utils';

export type GalleryImageWithContextProps = GalleryImageProps &
  Pick<ChatContextValue, 'ImageComponent'>;

export const GalleryImageWithContext = (props: GalleryImageWithContextProps) => {
  const { ImageComponent = Image, uri, ...rest } = props;

  // Caching image components such as FastImage will not work with local images.
  // This for the case of local uris, we use the default Image component.
  if (!isLocalUrl(uri)) {
    return (
      <ImageComponent
        {...rest}
        accessibilityLabel='Gallery Image'
        source={{
          uri: makeImageCompatibleUrl(uri),
        }}
      />
    );
  }

  return (
    <Image
      {...rest}
      accessibilityLabel='Gallery Image'
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
  const { ImageComponent } = useChatContext();

  return <MemoizedGalleryImage ImageComponent={ImageComponent} {...props} />;
};
