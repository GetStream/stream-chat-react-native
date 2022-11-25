import React from 'react';
import { Image, ImageProps } from 'react-native';

import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { getUrlWithoutParams, isLocalUrl, makeImageCompatibleUrl } from '../../utils/utils';

export type GalleryImageWithContextProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = GalleryImageProps & Pick<ChatContextValue<StreamChatGenerics>, 'ImageComponent'>;

export const GalleryImageWithContext: React.FC<GalleryImageWithContextProps> = (props) => {
  const { ImageComponent = Image, uri, ...rest } = props;

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

export const GalleryImage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: GalleryImageProps,
) => {
  const { ImageComponent } = useChatContext<StreamChatGenerics>();

  return <MemoizedGalleryImage ImageComponent={ImageComponent} {...props} />;
};
