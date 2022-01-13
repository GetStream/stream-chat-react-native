import React, { PropsWithChildren, useContext, useState } from 'react';

import type { MessageType } from '../../components/MessageList/hooks/useMessageList';
import type { StreamChatGenerics } from '../../types/types';
import { getDisplayName } from '../utils/getDisplayName';

export type ImageGalleryContextValue<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = {
  images: MessageType<At, Ch, Co, Ev, Me, Re, Us>[];
  setImage: React.Dispatch<React.SetStateAction<{ messageId?: string; url?: string } | undefined>>;
  setImages: React.Dispatch<React.SetStateAction<MessageType<At, Ch, Co, Ev, Me, Re, Us>[]>>;
  image?: { messageId?: string; url?: string };
};

export const ImageGalleryContext = React.createContext<ImageGalleryContextValue>(
  {} as ImageGalleryContextValue,
);

export const ImageGalleryProvider = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>({
  children,
}: PropsWithChildren<UnknownType>) => {
  const [images, setImages] = useState<MessageType<At, Ch, Co, Ev, Me, Re, Us>[]>([]);
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

export const useImageGalleryContext = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>() =>
  useContext(ImageGalleryContext) as unknown as ImageGalleryContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >;

export const withImageGalleryContext = <P extends UnknownType, StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ImageGalleryContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithImageGalleryContextComponent = (
    props: Omit<P, keyof ImageGalleryContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const imageGalleryContext = useImageGalleryContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...imageGalleryContext} />;
  };
  WithImageGalleryContextComponent.displayName = `WithImageGalleryContext${getDisplayName(
    Component,
  )}`;
  return WithImageGalleryContextComponent;
};
