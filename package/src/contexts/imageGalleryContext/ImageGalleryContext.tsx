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

export const ImageGalleryContext =
  React.createContext<ImageGalleryContextValue | undefined>(undefined);

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
>() => {
  const contextValue = useContext(
    ImageGalleryContext,
  ) as unknown as ImageGalleryContextValue<StreamChatGenerics>;

  if (!contextValue) {
    console.error(
      `The useImageGalleryContext hook was called outside the ImageGalleryContext Provider. Make sure you have configured OverlayProvider component correctly(https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider).`,
    );

    return {} as ImageGalleryContextValue<StreamChatGenerics>;
  }

  return contextValue as ImageGalleryContextValue<StreamChatGenerics>;
};

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
