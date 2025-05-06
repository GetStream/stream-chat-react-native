import React, { PropsWithChildren, useContext, useState } from 'react';

import { LocalMessage } from 'stream-chat';

import type { UnknownType } from '../../types/types';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

type SelectedMessage = {
  messageId?: string;
  url?: string;
};

export type ImageGalleryContextValue = {
  messages: LocalMessage[];
  setMessages: React.Dispatch<React.SetStateAction<LocalMessage[]>>;
  setSelectedMessage: React.Dispatch<React.SetStateAction<SelectedMessage | undefined>>;
  selectedMessage?: SelectedMessage;
};

export const ImageGalleryContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ImageGalleryContextValue,
);

export const ImageGalleryProvider = ({ children }: PropsWithChildren<UnknownType>) => {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
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

export const useImageGalleryContext = () => {
  const contextValue = useContext(ImageGalleryContext) as unknown as ImageGalleryContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useImageGalleryContext hook was called outside the ImageGalleryContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider',
    );
  }

  return contextValue as ImageGalleryContextValue;
};
