import React, { PropsWithChildren, useContext, useState } from 'react';

import type { MessageType } from '../../components/MessageList/hooks/useMessageList';
import type { DefaultStreamChatGenerics, UnknownType } from '../../types/types';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { getDisplayName } from '../utils/getDisplayName';
import { isTestEnvironment } from '../utils/isTestEnvironment';

type SelectedMessage = {
  messageId?: string;
  url?: string;
};

export type ImageGalleryContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  messages: MessageType<StreamChatGenerics>[];
  setMessages: React.Dispatch<React.SetStateAction<MessageType<StreamChatGenerics>[]>>;
  setSelectedMessage: React.Dispatch<React.SetStateAction<SelectedMessage | undefined>>;
  selectedMessage?: SelectedMessage;
};

export const ImageGalleryContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ImageGalleryContextValue,
);

export const ImageGalleryProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
}: PropsWithChildren<UnknownType>) => {
  const [messages, setMessages] = useState<MessageType<StreamChatGenerics>[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<SelectedMessage>();

  return (
    <ImageGalleryContext.Provider
      value={
        {
          messages,
          selectedMessage,
          setMessages,
          setSelectedMessage,
        } as unknown as ImageGalleryContextValue
      }
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

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      `The useImageGalleryContext hook was called outside the ImageGalleryContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider`,
    );
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
