import React, { PropsWithChildren, useContext, useState } from 'react';

import type { MessageType } from '../../components/MessageList/hooks/useMessageList';
import type { DefaultStreamChatGenerics, UnknownType } from '../../types/types';
import { getDisplayName } from '../utils/getDisplayName';

export type ImageGalleryContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  images: MessageType<StreamChatGenerics>[];
  setImage: React.Dispatch<React.SetStateAction<{ messageId?: string; url?: string } | undefined>>;
  setImages: React.Dispatch<React.SetStateAction<MessageType<StreamChatGenerics>[]>>;
  image?: { messageId?: string; url?: string };
};

export const ImageGalleryContext = React.createContext<ImageGalleryContextValue>(
  {} as ImageGalleryContextValue,
);

export const ImageGalleryProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
}: PropsWithChildren<UnknownType>) => {
  const [images, setImages] = useState<MessageType<StreamChatGenerics>[]>([]);
  const [image, setImage] = useState<{ messageId?: string; url?: string }>();

  const imageGalleryContext = {
    image,
    images,
    setImage,
    setImages,
  };

  return (
    <ImageGalleryContext.Provider
      value={imageGalleryContext as unknown as ImageGalleryContextValue}
    >
      {children}
    </ImageGalleryContext.Provider>
  );
};

export const useImageGalleryContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => useContext(ImageGalleryContext) as unknown as ImageGalleryContextValue<StreamChatGenerics>;

export const withImageGalleryContext = <
  P extends UnknownType,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ImageGalleryContextValue<StreamChatGenerics>>> => {
  const WithImageGalleryContextComponent = (
    props: Omit<P, keyof ImageGalleryContextValue<StreamChatGenerics>>,
  ) => {
    const imageGalleryContext = useImageGalleryContext<StreamChatGenerics>();

    return <Component {...(props as P)} {...imageGalleryContext} />;
  };
  WithImageGalleryContextComponent.displayName = `WithImageGalleryContext${getDisplayName(
    Component,
  )}`;
  return WithImageGalleryContextComponent;
};
